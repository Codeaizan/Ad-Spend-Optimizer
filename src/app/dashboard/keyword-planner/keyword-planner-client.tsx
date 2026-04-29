'use client';

import { useState } from 'react';
import { Campaign, AdGroup, KeywordSuggestion } from '@/lib/googleAdsData';
import { getKeywordSuggestions } from '@/lib/adsService';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Loader2, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';

interface KeywordPlannerClientProps {
  campaigns: Campaign[];
  adGroups: AdGroup[];
}

export function KeywordPlannerClient({ campaigns, adGroups }: KeywordPlannerClientProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Popover state per row
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedAdGroupId, setSelectedAdGroupId] = useState<string>('');
  const [addingId, setAddingId] = useState<string | null>(null);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US').format(val);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    const results = await getKeywordSuggestions();
    // Simulate query filtering logic
    const filtered = results.filter(r => r.keyword.toLowerCase().includes(query.toLowerCase()) || query.toLowerCase() === 'test');
    // If not matching, just return all to ensure data is shown for demo
    setSuggestions(filtered.length > 0 ? filtered : results);
    setIsSearching(false);
  };

  const getCompetitionColor = (level: string) => {
    switch(level) {
      case 'HIGH': return 'bg-rose-500';
      case 'MEDIUM': return 'bg-amber-500';
      case 'LOW': return 'bg-emerald-500';
      default: return 'bg-primary';
    }
  };

  const getCompetitionPercentage = (level: string) => {
    switch(level) {
      case 'HIGH': return '85%';
      case 'MEDIUM': return '50%';
      case 'LOW': return '15%';
      default: return '0%';
    }
  };

  const handleAddToCampaign = async (suggestion: KeywordSuggestion) => {
    if (!selectedCampaignId || !selectedAdGroupId) {
      toast.error('Please select both a Campaign and Ad Group');
      return;
    }

    setAddingId(suggestion.keyword);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    toast.success(`"${suggestion.keyword}" added successfully!`);
    setAddingId(null);
    setSelectedCampaignId('');
    setSelectedAdGroupId('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Keyword Planner</h1>
          <p className="text-muted-foreground">Discover new keywords and get search volume data.</p>
        </div>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-4 max-w-3xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Enter a keyword or website URL (e.g., 'running shoes')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 py-6 text-lg w-full bg-background/50 focus-visible:ring-primary/50"
              />
            </div>
            <Button type="submit" size="lg" disabled={isSearching} className="px-8 text-md shadow-md bg-blue-600 hover:bg-blue-700 text-white">
              {isSearching ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Get Results'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Keyword</TableHead>
                <TableHead className="text-right">Avg. Monthly Searches</TableHead>
                <TableHead className="w-[200px]">Competition</TableHead>
                <TableHead className="text-right">Top of Page Bid (Low)</TableHead>
                <TableHead className="text-right">Top of Page Bid (High)</TableHead>
                <TableHead className="text-center w-[150px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isSearching ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Analyzing keywords...</p>
                  </TableCell>
                </TableRow>
              ) : !hasSearched ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                    Enter a keyword or URL above to see suggestions.
                  </TableCell>
                </TableRow>
              ) : suggestions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                    No keywords found for your query. Try a different term.
                  </TableCell>
                </TableRow>
              ) : (
                suggestions.map(s => (
                  <TableRow key={s.keyword} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-primary/90">{s.keyword}</TableCell>
                    <TableCell className="text-right font-medium">{formatNumber(s.avgMonthlySearches)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-12">{s.competition}</span>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getCompetitionColor(s.competition)}`}
                            style={{ width: getCompetitionPercentage(s.competition) }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(s.suggestedBid * 0.8)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(s.suggestedBid * 1.5)}</TableCell>
                    <TableCell className="text-center">
                      <Popover>
                        {/* @ts-ignore */}
                        <PopoverTrigger asChild>
                          <Button variant="secondary" size="sm" className="w-full">
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4" align="end">
                          <div className="space-y-4">
                            <h4 className="font-medium leading-none">Add Keyword</h4>
                            <p className="text-sm text-muted-foreground">
                              Assign <strong>"{s.keyword}"</strong> to an ad group.
                            </p>
                            
                            <div className="space-y-2">
                              <Select value={selectedCampaignId} onValueChange={(val) => setSelectedCampaignId(val || '')}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Campaign" />
                                </SelectTrigger>
                                <SelectContent>
                                  {campaigns.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Select 
                                value={selectedAdGroupId} 
                                onValueChange={(val) => setSelectedAdGroupId(val || '')}
                                disabled={!selectedCampaignId}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Ad Group" />
                                </SelectTrigger>
                                <SelectContent>
                                  {adGroups.filter(ag => ag.campaignId === selectedCampaignId).map(ag => (
                                    <SelectItem key={ag.id} value={ag.id}>{ag.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <Button 
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                              onClick={() => handleAddToCampaign(s)}
                              disabled={addingId === s.keyword}
                            >
                              {addingId === s.keyword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                              Confirm Assignment
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
