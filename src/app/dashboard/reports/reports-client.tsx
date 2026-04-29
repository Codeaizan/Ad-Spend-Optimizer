'use client';

import { useState, useMemo } from 'react';
import { Campaign, Metrics, Keyword, Ad } from '@/lib/mockGoogleAds';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, ArrowUpDown, BarChart2, LineChart as LineChartIcon } from 'lucide-react';
import { subDays, format } from 'date-fns';

interface ReportsClientProps {
  campaigns: Campaign[];
  metrics: Metrics[];
  keywords: Keyword[];
  ads: Ad[];
}

const METRICS_OPTIONS = [
  { id: 'impressions', label: 'Impressions', color: '#8b5cf6' },
  { id: 'clicks', label: 'Clicks', color: '#f59e0b' },
  { id: 'cost', label: 'Cost', color: '#3b82f6' },
  { id: 'ctr', label: 'CTR', color: '#10b981' },
  { id: 'averageCpc', label: 'Avg CPC', color: '#ec4899' },
  { id: 'conversions', label: 'Conversions', color: '#06b6d4' },
  { id: 'roas', label: 'ROAS', color: '#6366f1' },
];

export function ReportsClient({ campaigns, metrics, keywords, ads }: ReportsClientProps) {
  const [dateRange, setDateRange] = useState('30');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['clicks', 'cost']);
  
  // Sorting for Performance Table
  const [perfSortField, setPerfSortField] = useState<string>('date');
  const [perfSortDesc, setPerfSortDesc] = useState(true);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(val);
  const formatPercent = (val: number) => new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 }).format(val);

  const toggleMetric = (id: string) => {
    setSelectedMetrics(prev => 
      prev.includes(id) 
        ? prev.filter(m => m !== id)
        : [...prev, id]
    );
  };

  // Filter metrics by date range
  const daysToFilter = parseInt(dateRange, 10);
  const cutoffDate = format(subDays(new Date(), daysToFilter), 'yyyy-MM-dd');
  
  const filteredMetrics = useMemo(() => {
    return metrics.filter(m => m.date >= cutoffDate);
  }, [metrics, cutoffDate]);

  // Aggregate metrics daily
  const dailyData = useMemo(() => {
    const map = new Map<string, any>();
    filteredMetrics.forEach(m => {
      const existing = map.get(m.date) || { 
        date: m.date, 
        impressions: 0, clicks: 0, cost: 0, conversions: 0,
        ctr: 0, averageCpc: 0, roas: 0,
        dateFormatted: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
      existing.impressions += m.impressions;
      existing.clicks += m.clicks;
      existing.cost += m.cost;
      existing.conversions += m.conversions;
      map.set(m.date, existing);
    });
    
    return Array.from(map.values()).map(d => ({
      ...d,
      ctr: d.impressions > 0 ? d.clicks / d.impressions : 0,
      averageCpc: d.clicks > 0 ? d.cost / d.clicks : 0,
      roas: d.cost > 0 ? (d.conversions * 50) / d.cost : 0 // Mock conversion value of 50
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredMetrics]);

  // Sort Performance Table
  const sortedDailyData = useMemo(() => {
    return [...dailyData].sort((a, b) => {
      let valA = a[perfSortField];
      let valB = b[perfSortField];
      if (typeof valA === 'string') return perfSortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      return perfSortDesc ? valB - valA : valA - valB;
    });
  }, [dailyData, perfSortField, perfSortDesc]);

  const handlePerfSort = (field: string) => {
    if (perfSortField === field) setPerfSortDesc(!perfSortDesc);
    else { setPerfSortField(field); setPerfSortDesc(true); }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Impressions', 'Clicks', 'CTR', 'Avg CPC', 'Cost', 'Conversions', 'ROAS'];
    const rows = sortedDailyData.map(d => [
      d.date, d.impressions, d.clicks, d.ctr.toFixed(4), d.averageCpc.toFixed(2), d.cost.toFixed(2), d.conversions, d.roas.toFixed(2)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n" 
      + rows.map(e => e.join(',')).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `performance_report_${dateRange}days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Analyze your data across multiple dimensions.</p>
        </div>
        <Select value={dateRange} onValueChange={(val) => setDateRange(val || '30')}>
          <SelectTrigger className="w-[180px] bg-card/50 backdrop-blur-sm border-border/50">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="performance" className="w-full space-y-6">
        <TabsList className="bg-muted/50 p-1 overflow-x-auto w-full justify-start rounded-xl h-12">
          <TabsTrigger value="performance" className="rounded-lg">Performance</TabsTrigger>
          <TabsTrigger value="campaigns" className="rounded-lg">Campaigns</TabsTrigger>
          <TabsTrigger value="keywords" className="rounded-lg">Keywords</TabsTrigger>
          <TabsTrigger value="ads" className="rounded-lg">Ads</TabsTrigger>
        </TabsList>
        
        {/* PERFORMANCE TAB */}
        <TabsContent value="performance" className="space-y-6 outline-none">
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Select metrics to compare</CardDescription>
              </div>
              <div className="flex bg-muted/50 p-1 rounded-lg">
                <Button variant={chartType === 'line' ? 'secondary' : 'ghost'} size="sm" onClick={() => setChartType('line')} className="rounded-md">
                  <LineChartIcon className="h-4 w-4 mr-2" /> Line
                </Button>
                <Button variant={chartType === 'bar' ? 'secondary' : 'ghost'} size="sm" onClick={() => setChartType('bar')} className="rounded-md">
                  <BarChart2 className="h-4 w-4 mr-2" /> Bar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                {METRICS_OPTIONS.map(opt => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`metric-${opt.id}`} 
                      checked={selectedMetrics.includes(opt.id)}
                      onCheckedChange={() => toggleMetric(opt.id)}
                    />
                    <Label htmlFor={`metric-${opt.id}`} className="flex items-center gap-2 cursor-pointer">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: opt.color }}></span>
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <LineChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
                      <XAxis dataKey="dateFormatted" stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} />
                      <YAxis stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                      {selectedMetrics.map(metricId => {
                        const opt = METRICS_OPTIONS.find(o => o.id === metricId);
                        return <Line key={metricId} type="monotone" dataKey={metricId} stroke={opt?.color} strokeWidth={2} name={opt?.label} dot={false} />;
                      })}
                    </LineChart>
                  ) : (
                    <BarChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
                      <XAxis dataKey="dateFormatted" stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} />
                      <YAxis stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} cursor={{fill: 'currentColor', opacity: 0.1}} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                      {selectedMetrics.map(metricId => {
                        const opt = METRICS_OPTIONS.find(o => o.id === metricId);
                        return <Bar key={metricId} dataKey={metricId} fill={opt?.color} name={opt?.label} radius={[4, 4, 0, 0]} />;
                      })}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daily Breakdown</CardTitle>
              <Button onClick={exportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer hover:text-primary" onClick={() => handlePerfSort('date')}>Date <ArrowUpDown className="inline h-3 w-3" /></TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-primary" onClick={() => handlePerfSort('impressions')}>Impr. <ArrowUpDown className="inline h-3 w-3" /></TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-primary" onClick={() => handlePerfSort('clicks')}>Clicks <ArrowUpDown className="inline h-3 w-3" /></TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-primary" onClick={() => handlePerfSort('ctr')}>CTR <ArrowUpDown className="inline h-3 w-3" /></TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-primary" onClick={() => handlePerfSort('averageCpc')}>Avg CPC <ArrowUpDown className="inline h-3 w-3" /></TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-primary" onClick={() => handlePerfSort('cost')}>Cost <ArrowUpDown className="inline h-3 w-3" /></TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-primary" onClick={() => handlePerfSort('conversions')}>Conv. <ArrowUpDown className="inline h-3 w-3" /></TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-primary" onClick={() => handlePerfSort('roas')}>ROAS <ArrowUpDown className="inline h-3 w-3" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDailyData.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No data found</TableCell></TableRow>
                  ) : (
                    sortedDailyData.map(row => (
                      <TableRow key={row.date} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{row.dateFormatted}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.impressions)}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.clicks)}</TableCell>
                        <TableCell className="text-right">{formatPercent(row.ctr)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.averageCpc)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.cost)}</TableCell>
                        <TableCell className="text-right">{formatNumber(row.conversions)}</TableCell>
                        <TableCell className="text-right text-emerald-500 font-medium">{row.roas.toFixed(2)}x</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CAMPAIGNS TAB */}
        <TabsContent value="campaigns" className="outline-none">
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader><CardTitle>Campaign Comparison</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No data found</TableCell></TableRow>
                  ) : (
                    campaigns.map(c => {
                      const cMet = filteredMetrics.filter(m => m.campaignId === c.id);
                      const cost = cMet.reduce((acc, m) => acc + m.cost, 0);
                      const conversions = cMet.reduce((acc, m) => acc + m.conversions, 0);
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell className="text-xs">{c.type.replace('_', ' ')}</TableCell>
                          <TableCell className="text-right">{formatCurrency(c.dailyBudget)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(cost)}</TableCell>
                          <TableCell className="text-right">{formatNumber(conversions)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KEYWORDS TAB */}
        <TabsContent value="keywords" className="outline-none">
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader><CardTitle>Keyword Performance</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Match Type</TableHead>
                    <TableHead className="text-right">QS</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No data found</TableCell></TableRow>
                  ) : (
                    keywords.map(kw => (
                      <TableRow key={kw.id}>
                        <TableCell className="font-medium">{kw.keyword}</TableCell>
                        <TableCell className="text-xs">{kw.matchType}</TableCell>
                        <TableCell className="text-right">{kw.qualityScore}/10</TableCell>
                        <TableCell className="text-right">{formatNumber(kw.clicks)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(kw.cost)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADS TAB */}
        <TabsContent value="ads" className="outline-none">
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader><CardTitle>Ad Performance</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Headline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Impr.</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No data found</TableCell></TableRow>
                  ) : (
                    ads.map(ad => (
                      <TableRow key={ad.id}>
                        <TableCell className="font-medium">{ad.headlines[0]}</TableCell>
                        <TableCell className="text-xs">{ad.status}</TableCell>
                        <TableCell className="text-right">{formatNumber(ad.impressions)}</TableCell>
                        <TableCell className="text-right">{formatNumber(ad.clicks)}</TableCell>
                        <TableCell className="text-right font-medium">{formatPercent(ad.ctr)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
