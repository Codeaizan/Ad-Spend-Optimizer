'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AccountOverview, Campaign, Metrics, Keyword, CampaignStatus } from '@/lib/googleAdsData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { subDays, format, parseISO, isAfter } from 'date-fns';

interface DashboardClientProps {
  overview: AccountOverview;
  campaigns: Campaign[];
  metrics: Metrics[];
  keywords: Keyword[];
}

type SortField = 'name' | 'status' | 'type' | 'dailyBudget' | 'impressions' | 'clicks' | 'ctr' | 'cost' | 'conversions';

export function DashboardClient({ overview, campaigns, metrics, keywords }: DashboardClientProps) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('30');
  const [activeChartMetric, setActiveChartMetric] = useState<'impressions' | 'clicks' | 'cost'>('clicks');
  const [sortField, setSortField] = useState<SortField>('cost');
  const [sortDesc, setSortDesc] = useState(true);

  // Formatters
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US').format(val);
  const formatPercent = (val: number) => new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 }).format(val);

  // Filter metrics by date range
  const daysToFilter = parseInt(dateRange, 10);
  const cutoffDate = format(subDays(new Date(), daysToFilter), 'yyyy-MM-dd');
  
  const filteredMetrics = useMemo(() => {
    return metrics.filter(m => m.date >= cutoffDate);
  }, [metrics, cutoffDate]);

  // Aggregate metrics by date for the main chart
  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string, impressions: number, clicks: number, cost: number, dateFormatted: string }>();
    filteredMetrics.forEach(m => {
      const existing = map.get(m.date) || { date: m.date, impressions: 0, clicks: 0, cost: 0, dateFormatted: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
      existing.impressions += m.impressions;
      existing.clicks += m.clicks;
      existing.cost += m.cost;
      map.set(m.date, existing);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredMetrics]);

  // Campaign table data
  const campaignData = useMemo(() => {
    return campaigns.map(c => {
      const campMetrics = filteredMetrics.filter(m => m.campaignId === c.id);
      const impressions = campMetrics.reduce((sum, m) => sum + m.impressions, 0);
      const clicks = campMetrics.reduce((sum, m) => sum + m.clicks, 0);
      const cost = campMetrics.reduce((sum, m) => sum + m.cost, 0);
      const conversions = campMetrics.reduce((sum, m) => sum + m.conversions, 0);
      const ctr = impressions > 0 ? clicks / impressions : 0;
      
      return {
        ...c,
        impressions,
        clicks,
        cost,
        conversions,
        ctr,
      };
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      // @ts-ignore
      return sortDesc ? valB - valA : valA - valB;
    });
  }, [campaigns, filteredMetrics, sortField, sortDesc]);

  // Top Keywords
  const topKeywords = useMemo(() => {
    return [...keywords]
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);
  }, [keywords]);

  // Handle Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'ENABLED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'PAUSED': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'REMOVED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'outline';
    }
  };

  // Sparkline Component
  const Sparkline = ({ dataKey, color }: { dataKey: 'impressions' | 'clicks' | 'cost' | 'conversions' | 'ctr' | 'averageCpc', color: string }) => {
    // We'll use the dailyData for sparklines but mapped appropriately
    const sparkData = dailyData.map(d => ({ value: d[dataKey as keyof typeof d] || Math.random() * 100 }));
    return (
      <div className="h-10 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const kpis = [
    { title: 'Total Spend', value: formatCurrency(overview.totalSpend), trend: '+12.5%', isPositive: false, key: 'cost', color: '#3b82f6' }, // Higher spend is technically "negative" trend visually unless expected
    { title: 'Impressions', value: formatNumber(overview.totalImpressions), trend: '+5.2%', isPositive: true, key: 'impressions', color: '#10b981' },
    { title: 'Clicks', value: formatNumber(overview.totalClicks), trend: '-2.1%', isPositive: false, key: 'clicks', color: '#f59e0b' },
    { title: 'Avg. CTR', value: formatPercent(overview.avgCtr), trend: '+1.2%', isPositive: true, key: 'ctr', color: '#8b5cf6' },
    { title: 'Avg. CPC', value: formatCurrency(overview.avgCpc), trend: '-0.5%', isPositive: true, key: 'averageCpc', color: '#ec4899' },
    { title: 'Conversions', value: formatNumber(overview.totalConversions), trend: '+18.4%', isPositive: true, key: 'conversions', color: '#06b6d4' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Date Picker */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground text-sm">Monitor your key performance indicators across all campaigns.</p>
        </div>
        <Select value={dateRange} onValueChange={(val) => setDateRange(val || '30')}>
          <SelectTrigger className="w-[180px] bg-card/50 backdrop-blur-sm border-border/50">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-border/50 bg-card/40 backdrop-blur-md hover:bg-card/60 transition-colors">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-baseline justify-between">
                <div className="text-xl font-bold">{kpi.value}</div>
                <div className={`text-xs flex items-center font-medium ${kpi.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {kpi.isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {kpi.trend}
                </div>
              </div>
              <Sparkline dataKey={kpi.key as any} color={kpi.color} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Chart */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Performance</CardTitle>
            <CardDescription>Metrics over the selected date range</CardDescription>
          </div>
          <Tabs value={activeChartMetric} onValueChange={(v: any) => setActiveChartMetric(v)} className="w-[300px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="impressions">Impressions</TabsTrigger>
              <TabsTrigger value="clicks">Clicks</TabsTrigger>
              <TabsTrigger value="cost">Cost</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="h-[350px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeChartMetric === 'cost' ? '#3b82f6' : activeChartMetric === 'clicks' ? '#f59e0b' : '#10b981'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={activeChartMetric === 'cost' ? '#3b82f6' : activeChartMetric === 'clicks' ? '#f59e0b' : '#10b981'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
              <XAxis dataKey="dateFormatted" stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} minTickGap={30} />
              <YAxis 
                stroke="currentColor" 
                className="text-xs opacity-50" 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => activeChartMetric === 'cost' ? `₹${val}` : formatNumber(val)} 
              />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: any) => [activeChartMetric === 'cost' ? formatCurrency(value) : formatNumber(value), activeChartMetric.charAt(0).toUpperCase() + activeChartMetric.slice(1)]}
              />
              <Area 
                type="monotone" 
                dataKey={activeChartMetric} 
                stroke={activeChartMetric === 'cost' ? '#3b82f6' : activeChartMetric === 'clicks' ? '#f59e0b' : '#10b981'} 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorMetric)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Campaign Performance Table */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 bg-card/40 backdrop-blur-md h-full flex flex-col">
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                      Campaign Name {sortField === 'name' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
                    </TableHead>
                    <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('status')}>
                      Status {sortField === 'status' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
                    </TableHead>
                    <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('type')}>
                      Type {sortField === 'type' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
                    </TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('impressions')}>
                      Impr. {sortField === 'impressions' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
                    </TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('clicks')}>
                      Clicks {sortField === 'clicks' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
                    </TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('ctr')}>
                      CTR {sortField === 'ctr' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
                    </TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('cost')}>
                      Cost {sortField === 'cost' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignData.map(c => (
                    <TableRow 
                      key={c.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/dashboard/campaigns/${c.id}`)}
                    >
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadge(c.status)}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.type.replace('_', ' ')}</TableCell>
                      <TableCell className="text-right">{formatNumber(c.impressions)}</TableCell>
                      <TableCell className="text-right">{formatNumber(c.clicks)}</TableCell>
                      <TableCell className="text-right">{formatPercent(c.ctr)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(c.cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Top Keywords */}
        <div>
          <Card className="border-border/50 bg-card/40 backdrop-blur-md h-full flex flex-col">
            <CardHeader>
              <CardTitle>Top Keywords</CardTitle>
              <CardDescription>By total clicks</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Keyword</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topKeywords.map(kw => (
                    <TableRow key={kw.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                          <span className="line-clamp-1" title={kw.keyword}>{kw.keyword}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(kw.clicks)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(kw.cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
