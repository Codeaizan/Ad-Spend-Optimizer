'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

type CampaignStatus = 'ENABLED' | 'PAUSED' | 'REMOVED';
type CampaignType = string;
type Platform = 'Google Ads' | 'Facebook Ads';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Search, Plus, Pencil, Trash2, ArrowUpDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_KEY = process.env.NEXT_PUBLIC_DASHBOARD_API_KEY || '';

interface CampaignWithMetrics {
  id: string;
  name: string;
  status: CampaignStatus;
  type: string;
  platform: Platform;
  dailyBudget: number;
  totalSpend: number;
  startDate: string;
  endDate?: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  avgCpc: number;
}

export function CampaignsPageClient({ initialCampaigns }: { initialCampaigns: CampaignWithMetrics[] }) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignWithMetrics[]>(initialCampaigns);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<keyof CampaignWithMetrics>('name');
  const [sortDesc, setSortDesc] = useState(false);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US').format(val);
  const formatPercent = (val: number) => new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 }).format(val);

  const filteredAndSortedCampaigns = useMemo(() => {
    return campaigns
      .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
        const matchesPlatform = platformFilter === 'ALL' || c.platform === platformFilter;
        return matchesSearch && matchesStatus && matchesPlatform;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
        }
        // @ts-ignore
        return sortDesc ? valB - valA : valA - valB;
      });
  }, [campaigns, search, statusFilter, platformFilter, sortField, sortDesc]);

  const handleSort = (field: keyof CampaignWithMetrics) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedCampaigns.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedCampaigns.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // ─── API-backed mutations (server-side persistence) ─────────────

  const handleStatusToggle = async (id: string, currentStatus: CampaignStatus) => {
    setIsUpdating(id);
    const newStatus = currentStatus === 'ENABLED' ? 'PAUSED' : 'ENABLED';
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: newStatus } : c));
        toast.success(`Campaign ${newStatus.toLowerCase()}`);
      } else {
        toast.error(json.error || 'Failed to update status');
      }
    } catch {
      toast.error('Network error — could not update campaign');
    }
    setIsUpdating(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/campaigns/${deleteId}`, {
        method: 'DELETE',
        headers: { 'x-api-key': API_KEY },
      });
      const json = await res.json();
      if (json.success) {
        setCampaigns(campaigns.filter(c => c.id !== deleteId));
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(deleteId);
          return newSet;
        });
        toast.success('Campaign deleted');
      } else {
        toast.error(json.error || 'Failed to delete campaign');
      }
    } catch {
      toast.error('Network error — could not delete campaign');
    }
    setIsDeleting(false);
    setDeleteId(null);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      goal: formData.get('goal') as string,
      status: formData.get('status') as string,
      dailyBudget: Number(formData.get('budget')),
      startDate: formData.get('startDate') as string,
      endDate: (formData.get('endDate') as string) || undefined,
    };

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        const created = json.data;
        const newCampaignWithMetrics: CampaignWithMetrics = {
          ...created,
          platform: created.platform || 'Google Ads',
          impressions: 0,
          clicks: 0,
          cost: 0,
          conversions: 0,
          ctr: 0,
          avgCpc: 0,
        };
        setCampaigns([newCampaignWithMetrics, ...campaigns]);
        toast.success('Campaign created successfully');
      } else {
        toast.error(json.error || 'Failed to create campaign');
      }
    } catch {
      toast.error('Network error — could not create campaign');
    }
    setIsCreating(false);
    setIsCreateModalOpen(false);
  };

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'ENABLED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'PAUSED': return 'bg-orange-500/15 text-orange-500 border-orange-500/30 font-semibold';
      case 'REMOVED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'outline';
    }
  };

  const getPlatformBadge = (platform: Platform) => {
    switch (platform) {
      case 'Google Ads': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Facebook Ads': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
          <Plus className="h-4 w-4 mr-2" /> New Campaign
        </Button>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/50">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={platformFilter} onValueChange={(val) => setPlatformFilter(val || 'ALL')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Platforms</SelectItem>
                <SelectItem value="Google Ads">Google Ads</SelectItem>
                <SelectItem value="Facebook Ads">Facebook Ads</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'ALL')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ENABLED">Enabled</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="REMOVED">Removed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox 
                    checked={selectedIds.size === filteredAndSortedCampaigns.length && filteredAndSortedCampaigns.length > 0} 
                    onCheckedChange={toggleSelectAll} 
                  />
                </TableHead>
                <TableHead className="cursor-pointer hover:text-primary transition-colors min-w-[200px]" onClick={() => handleSort('name')}>
                  Campaign Name <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('platform')}>
                  Platform <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('status')}>
                  Status <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('dailyBudget')}>
                  Budget <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('impressions')}>
                  Impr. <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('clicks')}>
                  Clicks <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('ctr')}>
                  CTR <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('avgCpc')}>
                  Avg CPC <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('cost')}>
                  Cost <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('conversions')}>
                  Conv. <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                    No campaigns found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedCampaigns.map(c => (
                  <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} />
                    </TableCell>
                    <TableCell className="font-medium">
                      <span 
                        onClick={() => router.push(`/dashboard/campaigns/${c.id}`)}
                        className="hover:underline cursor-pointer text-primary/90 hover:text-primary"
                      >
                        {c.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPlatformBadge(c.platform)}>
                        {c.platform}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={c.status === 'ENABLED'} 
                          onCheckedChange={() => handleStatusToggle(c.id, c.status)}
                          disabled={isUpdating === c.id || c.status === 'REMOVED'}
                        />
                        <Badge variant="outline" className={getStatusBadge(c.status)}>
                          {c.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <Badge variant="secondary" className="bg-muted/50">{c.type.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(c.dailyBudget)}</TableCell>
                    <TableCell className="text-right">{formatNumber(c.impressions)}</TableCell>
                    <TableCell className="text-right">{formatNumber(c.clicks)}</TableCell>
                    <TableCell className="text-right">{formatPercent(c.ctr)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.avgCpc)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(c.cost)}</TableCell>
                    <TableCell className="text-right">{formatNumber(c.conversions)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => router.push(`/dashboard/campaigns/${c.id}`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteId(c.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create Campaign Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>Fill in the details to launch your new campaign.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" name="name" required className="col-span-3" placeholder="e.g. Summer Sale 2026" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Type</Label>
                <div className="col-span-3">
                  <Select name="type" required defaultValue="SEARCH">
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEARCH">Search</SelectItem>
                      <SelectItem value="DISPLAY">Display</SelectItem>
                      <SelectItem value="PERFORMANCE_MAX">Performance Max</SelectItem>
                      <SelectItem value="VIDEO">Video</SelectItem>
                      <SelectItem value="SHOPPING">Shopping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="goal" className="text-right">Goal</Label>
                <div className="col-span-3">
                  <Select name="goal" required defaultValue="SALES">
                    <SelectTrigger>
                      <SelectValue placeholder="Select goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SALES">Sales</SelectItem>
                      <SelectItem value="LEADS">Leads</SelectItem>
                      <SelectItem value="TRAFFIC">Website Traffic</SelectItem>
                      <SelectItem value="AWARENESS">Brand Awareness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="budget" className="text-right">Daily Budget (₹)</Label>
                <div className="col-span-3 relative">
                  <span className="absolute left-3 top-2 text-muted-foreground">₹</span>
                  <Input id="budget" name="budget" type="number" min="0" required className="pl-7" placeholder="1000" />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">Start Date</Label>
                <Input id="startDate" name="startDate" type="date" required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">End Date (Optional)</Label>
                <Input id="endDate" name="endDate" type="date" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Initial Status</Label>
                <RadioGroup defaultValue="ENABLED" name="status" className="col-span-3 flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ENABLED" id="r1" />
                    <Label htmlFor="r1">Enabled</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PAUSED" id="r2" />
                    <Label htmlFor="r2">Paused</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isCreating}>
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isCreating ? 'Creating...' : 'Create Campaign'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-rose-500 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Campaign
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">{campaigns.find(c => c.id === deleteId)?.name}</span>?
              <br /><br />
              This action cannot be undone and will permanently remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isDeleting ? 'Deleting...' : 'Delete Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
