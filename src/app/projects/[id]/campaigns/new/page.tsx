"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import type { Project } from '@/lib/models/project';
import type { Campaign, RewardType } from '@/lib/models/campaign';

// Mock project data
const mockProject: Project = {
  id: '1',
  name: 'CryptoKitties NFT',
  description: 'A revolutionary new NFT collection with unique traits',
  logo: '/projects/cryptokitties.png',
  owners: [
    { telegramId: 123456789, telegramUsername: 'johndoe', role: 'admin' },
    { telegramId: 987654321, telegramUsername: 'janedoe', role: 'manager' }
  ],
  socialAccounts: {
    telegram: {
      username: 'cryptokitties',
      channelName: 'CryptoKitties Official',
      channelUrl: 'https://t.me/cryptokitties',
      memberCount: 12500
    },
    x: {
      username: 'cryptokitties',
      followersCount: 35000,
      profileUrl: 'https://x.com/cryptokitties'
    },
    discord: {
      serverName: 'CryptoKitties',
      serverUrl: 'https://discord.gg/cryptokitties',
      memberCount: 18000
    },
    website: 'https://cryptokitties.com'
  },
  category: ['NFT', 'Art', 'Gaming'],
  subscription: {
    planId: 'pro',
    planName: 'Pro Plan',
    startDate: new Date('2023-09-01'),
    endDate: new Date('2024-09-01'),
    isActive: true,
    campaignsRemaining: 25,
    features: ['Unlimited Participants', 'Advanced Analytics', 'Priority Support']
  },
  verified: true,
  createdAt: new Date('2023-09-01'),
  updatedAt: new Date('2023-10-10'),
  stats: {
    totalCampaigns: 12,
    activeCampaigns: 3,
    participantCount: 4500,
    participationRate: 78,
    averageEngagement: 85,
    followerGrowth: {
      telegram: 1200,
      x: 2500,
      discord: 800,
      total: 4500
    }
  },
  settings: {
    defaultReminderInterval: 8,
    defaultReminderPlatforms: ['telegram', 'x'],
    defaultCampaignDuration: 7,
    autoRenewal: true,
    preferredRewardTypes: ['community_role', 'whitelist']
  }
};

// Form schema
const formSchema = z.object({
  name: z.string().min(5, {
    message: "Campaign name must be at least 5 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  xPostUrl: z.string().url({
    message: "Please enter a valid URL.",
  }),
  discordUrl: z.string().url({
    message: "Please enter a valid URL.",
  }).optional().or(z.literal('')),
  endDate: z.date({
    required_error: "Please select a date.",
  }),
  targetParticipants: z.number().min(1),
  isPrivate: z.boolean().default(false),
  tags: z.string(),
  requirements: z.string().optional(),
  automaticReminders: z.boolean().default(true),
  reminderPlatforms: z.object({
    telegram: z.boolean().default(true),
    x: z.boolean().default(true),
    discord: z.boolean().default(false),
  }),
  reminderInterval: z.number().min(1),
  rewards: z.array(
    z.object({
      type: z.enum(['community_role', 'exclusive_access', 'recognition', 'merchandise', 'whitelist', 'custom'] as const),
      description: z.string().min(5),
      requirements: z.string().optional(),
      value: z.string().optional(),
    })
  ).min(1, {
    message: "Please add at least one reward."
  }),
});

export default function CreateCampaignPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [reward, setReward] = useState({
    type: 'community_role' as RewardType,
    description: '',
    requirements: '',
    value: '',
  });

  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      xPostUrl: '',
      discordUrl: '',
      endDate: new Date(Date.now() + mockProject.settings.defaultCampaignDuration * 24 * 60 * 60 * 1000),
      targetParticipants: 100,
      isPrivate: false,
      tags: mockProject.category.join(', '),
      requirements: '',
      automaticReminders: true,
      reminderPlatforms: {
        telegram: mockProject.settings.defaultReminderPlatforms.includes('telegram'),
        x: mockProject.settings.defaultReminderPlatforms.includes('x'),
        discord: mockProject.settings.defaultReminderPlatforms.includes('discord'),
      },
      reminderInterval: mockProject.settings.defaultReminderInterval,
      rewards: [],
    },
  });

  // Add reward to form
  const addReward = () => {
    if (reward.description) {
      const currentRewards = form.getValues('rewards') || [];
      form.setValue('rewards', [...currentRewards, reward]);
      setReward({
        type: 'community_role' as RewardType,
        description: '',
        requirements: '',
        value: '',
      });
    }
  };

  // Remove reward from form
  const removeReward = (index: number) => {
    const currentRewards = form.getValues('rewards') || [];
    form.setValue('rewards', currentRewards.filter((_, i) => i !== index));
  };

  // Submit form
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log('Campaign created:', values);

    // Mock campaign creation
    const campaign: Partial<Campaign> = {
      id: `campaign-${Date.now()}`,
      name: values.name,
      description: values.description,
      projectName: mockProject.name,
      xPostUrl: values.xPostUrl,
      discordUrl: values.discordUrl || undefined,
      telegramChannelUrl: mockProject.socialAccounts.telegram.channelUrl,
      startDate: new Date(),
      endDate: values.endDate,
      targetParticipants: values.targetParticipants,
      currentParticipants: 0,
      rewards: values.rewards,
      createdBy: mockProject.owners[0].telegramId,
      participants: [],
      status: 'active',
      reminders: {
        sendAutomatically: values.automaticReminders,
        platforms: {
          telegram: values.reminderPlatforms.telegram,
          x: values.reminderPlatforms.x,
          discord: values.reminderPlatforms.discord,
        },
        interval: values.reminderInterval,
      },
      private: values.isPrivate,
      tags: values.tags.split(',').map(tag => tag.trim()),
      requirements: values.requirements,
      stats: {
        participationRate: 0,
        completionRate: 0,
        engagement: {
          likes: 0,
          retweets: 0,
          comments: 0,
          mentions: 0,
        },
        growth: {
          newFollowers: 0,
          impressions: 0,
          reach: 0,
        },
      },
    };

    // In a real app, this would send the campaign to the server
    alert('Campaign created successfully!');

    // Navigate back to campaigns list
    router.push(`/projects/${params.id}/campaigns`);
  };

  // Get display name for reward type
  const getRewardTypeDisplay = (type: RewardType) => {
    switch (type) {
      case 'community_role':
        return 'Community Role';
      case 'exclusive_access':
        return 'Exclusive Access';
      case 'recognition':
        return 'Recognition';
      case 'merchandise':
        return 'Merchandise';
      case 'whitelist':
        return 'Whitelist Spot';
      case 'custom':
        return 'Custom Reward';
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Create Campaign</h1>
          <p className="text-muted-foreground">
            for {mockProject.name}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Basic information about your campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter campaign name" {...field} />
                    </FormControl>
                    <FormDescription>
                      A clear, concise name for your campaign
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter campaign description"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Detailed description of what the campaign is about
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="xPostUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>X Post URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://x.com/username/status/123456789" {...field} />
                      </FormControl>
                      <FormDescription>
                        Link to the specific post you want participants to engage with
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discordUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discord Invite URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://discord.gg/yourinvite" {...field} />
                      </FormControl>
                      <FormDescription>
                        Link to your Discord server if applicable
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        The date when this campaign will end
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Participants</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        How many participants are you aiming for?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="NFT, DeFi, Gaming, etc." {...field} />
                      </FormControl>
                      <FormDescription>
                        Comma-separated list of tags
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Private Campaign</FormLabel>
                        <FormDescription>
                          Only invited participants will see this campaign
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirements (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any specific requirements for participation"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe any special requirements for this campaign
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reminder Settings</CardTitle>
              <CardDescription>
                Configure how participation reminders are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="automaticReminders"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Send Automatic Reminders</FormLabel>
                      <FormDescription>
                        Automatically send reminders to users who haven't participated
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("automaticReminders") && (
                <>
                  <FormField
                    control={form.control}
                    name="reminderInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reminder Interval (Hours)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          How frequently reminders will be sent (in hours)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Reminder Platforms</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="reminderPlatforms.telegram"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <FormLabel className="font-normal">Telegram</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reminderPlatforms.x"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <FormLabel className="font-normal">X (Twitter)</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reminderPlatforms.discord"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <FormLabel className="font-normal">Discord</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormDescription>
                      Select where you want reminders to be sent
                    </FormDescription>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Rewards</CardTitle>
              <CardDescription>
                Define what participants will receive for engaging
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Add New Reward</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rewardType">Reward Type</Label>
                    <Select
                      value={reward.type}
                      onValueChange={(val) => setReward({...reward, type: val as RewardType})}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select a reward type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="community_role">Community Role</SelectItem>
                        <SelectItem value="exclusive_access">Exclusive Access</SelectItem>
                        <SelectItem value="recognition">Recognition</SelectItem>
                        <SelectItem value="merchandise">Merchandise</SelectItem>
                        <SelectItem value="whitelist">Whitelist Spot</SelectItem>
                        <SelectItem value="custom">Custom Reward</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="rewardDescription">Description</Label>
                    <Input
                      id="rewardDescription"
                      value={reward.description}
                      onChange={(e) => setReward({...reward, description: e.target.value})}
                      placeholder="Describe the reward"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rewardRequirements">Requirements (Optional)</Label>
                    <Textarea
                      id="rewardRequirements"
                      value={reward.requirements}
                      onChange={(e) => setReward({...reward, requirements: e.target.value})}
                      placeholder="Any specific requirements for this reward"
                      className="mt-1.5 min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="rewardValue">Value Description (Optional)</Label>
                    <Textarea
                      id="rewardValue"
                      value={reward.value}
                      onChange={(e) => setReward({...reward, value: e.target.value})}
                      placeholder="Describe the value (e.g., 'Rare NFT worth $100')"
                      className="mt-1.5 min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This is for description only, not an actual monetary value
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={addReward}
                    disabled={!reward.description}
                  >
                    Add Reward
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Current Rewards</h3>

                {form.watch('rewards').length === 0 ? (
                  <div className="text-center py-8 border rounded-md bg-gray-50">
                    <p className="text-muted-foreground">Add at least one reward for your campaign</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.watch('rewards').map((reward, index) => (
                      <div key={`${reward.type}-${reward.description}`} className="flex justify-between items-start border rounded-md p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{getRewardTypeDisplay(reward.type)}</Badge>
                            <h4 className="font-medium">{reward.description}</h4>
                          </div>
                          {reward.requirements && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Requirements:</span> {reward.requirements}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeReward(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {form.formState.errors.rewards && (
                  <p className="text-sm text-red-500">{form.formState.errors.rewards.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit">
              Create Campaign
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
