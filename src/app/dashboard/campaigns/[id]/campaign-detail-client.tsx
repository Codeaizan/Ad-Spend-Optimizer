'use client';

import { useState, useMemo } from 'react';
import { Campaign, Metrics, AdGroup, Keyword, Ad } from '@/lib/googleAdsData';
import { updateCampaignStatus } from '@/lib/adsService'; // Assuming we'd add updateCampaignName in a real app
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ArrowLeft, ExternalLink, Calendar, Pencil, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface CampaignDetailProps {
  initialCampaign: Campaign;
  metrics: Metrics[];
  adGroups: AdGroup[];
  keywords: Keyword[];
  ads: Ad[];
}

export function CampaignDetailClient({ initialCampaign, metrics, adGroups, keywords, ads }: CampaignDetailProps) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(campaign.name);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US').format(val);
  const formatPercent = (val: number) => new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 }).format(val);

  const chartData = useMemo(() => {
    return [...metrics].sort((a, b) => a.date.localeCompare(b.date)).map(m => ({
      ...m,
      dateFormatted: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  }, [metrics]);

  const handleSaveTitle = () => {
    if (editTitleValue.trim()) {
      setCampaign({ ...campaign, name: editTitleValue.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleCancelTitle = () => {
    setEditTitleValue(campaign.name);
    setIsEditingTitle(false);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ENABLED': return 'default';
      case 'PAUSED': return 'secondary';
      case 'REMOVED': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Inline Edit */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Link href="/dashboard/campaigns" className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input 
                  value={editTitleValue} 
                  onChange={(e) => setEditTitleValue(e.target.value)} 
                  className="max-w-xs font-bold text-lg h-9"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                />
                <Button size="icon" variant="ghost" onClick={handleSaveTitle} className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10">
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleCancelTitle} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 group">
                <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
                <Button size="icon" variant="ghost" onClick={() => setIsEditingTitle(true)} className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Badge variant={getStatusBadgeVariant(campaign.status)} className="capitalize">
                  {campaign.status.toLowerCase()}
                </Badge>
              </div>
            )}
            <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <Badge variant="outline">{campaign.type.replace('_', ' ')}</Badge>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(campaign.startDate).toLocaleDateString()} 
                {campaign.endDate ? ` - ${new Date(campaign.endDate).toLocaleDateString()}` : ' - Present'}
              </span>
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="adgroups">Ad Groups ({adGroups.length})</TabsTrigger>
          <TabsTrigger value="keywords">All Keywords ({keywords.length})</TabsTrigger>
          <TabsTrigger value="ads">All Ads ({ads.length})</TabsTrigger>
        </TabsList>
        
        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6 outline-none">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card/40 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Spend</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatCurrency(campaign.totalSpend)}</div></CardContent>
            </Card>
            <Card className="bg-card/40 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Daily Budget</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatCurrency(campaign.dailyBudget)}</div></CardContent>
            </Card>
            <Card className="bg-card/40 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Clicks</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatNumber(metrics.reduce((acc, m) => acc + m.clicks, 0))}</div></CardContent>
            </Card>
            <Card className="bg-card/40 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Conversions</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatNumber(metrics.reduce((acc, m) => acc + m.conversions, 0))}</div></CardContent>
            </Card>
          </div>

          <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
              <CardDescription>Clicks and Cost</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
                  <XAxis dataKey="dateFormatted" stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis yAxisId="left" stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" name="Clicks" />
                  <Area yAxisId="right" type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" name="Cost ($)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AD GROUPS TAB (Expandable) */}
        <TabsContent value="adgroups" className="outline-none">
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Ad Group Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Default CPC</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adGroups.map(ag => (
                  <ExpandableAdGroupRow 
                    key={ag.id} 
                    adGroup={ag} 
                    agKeywords={keywords.filter(k => k.adGroupId === ag.id)} 
                    agAds={ads.filter(a => a.adGroupId === ag.id)}
                    formatCurrency={formatCurrency}
                    formatNumber={formatNumber}
                    formatPercent={formatPercent}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* KEYWORDS TAB */}
        <TabsContent value="keywords" className="outline-none">
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Match Type</TableHead>
                  <TableHead className="text-right">Quality Score</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keywords.map(kw => (
                  <TableRow key={kw.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{kw.keyword}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{kw.matchType}</Badge></TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${kw.qualityScore >= 8 ? 'text-emerald-500' : kw.qualityScore <= 5 ? 'text-rose-500' : ''}`}>
                        {kw.qualityScore}/10
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(kw.clicks)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(kw.cost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ADS TAB */}
        <TabsContent value="ads" className="outline-none">
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Copy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map(ad => (
                  <TableRow key={ad.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="space-y-1 py-2">
                        <div className="font-medium text-primary line-clamp-1">{ad.headlines.join(' | ')}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">{ad.descriptions.join(' ')}</div>
                        <a href={ad.finalUrl} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-emerald-500 hover:underline">
                          <ExternalLink className="h-3 w-3" /> {ad.finalUrl}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={ad.status === 'ENABLED' ? 'default' : 'secondary'} className="capitalize">{ad.status.toLowerCase()}</Badge></TableCell>
                    <TableCell className="text-right font-medium">{formatPercent(ad.ctr)}</TableCell>
                    <TableCell className="text-right">{formatNumber(ad.clicks)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-component for expandable Ad Group rows
function ExpandableAdGroupRow({ 
  adGroup, agKeywords, agAds, formatCurrency, formatNumber, formatPercent 
}: { 
  adGroup: AdGroup, agKeywords: Keyword[], agAds: Ad[], formatCurrency: any, formatNumber: any, formatPercent: any 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <TableRow className="hover:bg-muted/30 cursor-pointer group" onClick={() => setIsExpanded(!isExpanded)}>
        <TableCell>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full p-0">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />}
          </Button>
        </TableCell>
        <TableCell className="font-medium">{adGroup.name}</TableCell>
        <TableCell><Badge variant={adGroup.status === 'ENABLED' ? 'default' : 'secondary'} className="capitalize">{adGroup.status.toLowerCase()}</Badge></TableCell>
        <TableCell className="text-right">{formatCurrency(adGroup.defaultCpc)}</TableCell>
        <TableCell className="text-right">{formatNumber(adGroup.impressions)}</TableCell>
        <TableCell className="text-right">{formatNumber(adGroup.clicks)}</TableCell>
        <TableCell className="text-right">{formatCurrency(adGroup.cost)}</TableCell>
      </TableRow>
      
      {isExpanded && (
        <TableRow className="bg-muted/10">
          <TableCell colSpan={7} className="p-0 border-b-2 border-primary/20">
            <div className="p-6">
              <Tabs defaultValue="ag-keywords" className="w-full">
                <TabsList className="bg-background border border-border">
                  <TabsTrigger value="ag-keywords">Keywords ({agKeywords.length})</TabsTrigger>
                  <TabsTrigger value="ag-ads">Ads ({agAds.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="ag-keywords" className="mt-4 outline-none">
                  <div className="border border-border/50 rounded-md bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Keyword</TableHead>
                          <TableHead>Match Type</TableHead>
                          <TableHead className="text-right">Clicks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agKeywords.length > 0 ? agKeywords.map(kw => (
                          <TableRow key={kw.id}>
                            <TableCell className="font-medium">{kw.keyword}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{kw.matchType}</Badge></TableCell>
                            <TableCell className="text-right">{formatNumber(kw.clicks)}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No keywords</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="ag-ads" className="mt-4 outline-none">
                  <div className="border border-border/50 rounded-md bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ad Copy</TableHead>
                          <TableHead className="text-right">CTR</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agAds.length > 0 ? agAds.map(ad => (
                          <TableRow key={ad.id}>
                            <TableCell>
                              <div className="font-medium text-primary text-sm">{ad.headlines[0]}</div>
                              <div className="text-xs text-muted-foreground">{ad.descriptions[0]}</div>
                            </TableCell>
                            <TableCell className="text-right">{formatPercent(ad.ctr)}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No ads</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
