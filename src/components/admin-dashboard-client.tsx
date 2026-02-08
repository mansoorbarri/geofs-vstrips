"use client";

import { useState, useEffect } from "react";
import { UserList } from "~/components/user-list";
import Footer from "~/components/footer";
import Loading from "~/components/loading";
import Header from "~/components/header";
import { useCurrentUser } from "~/hooks/use-current-user";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { toast } from "sonner";
import { searchGlobalAirports, type ExternalAirport } from "~/lib/fetch-airports";
import { useEventSettings } from "~/hooks/use-event-settings";

export function AdminDashboardClient() {
  const { user: convexUser } = useCurrentUser();
  const users = useQuery(api.users.list);
  const toggleController = useMutation(api.users.toggleController);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExternalAirport[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { settings: convexSettings, isLoading: isLoadingSettings, updateSettings } = useEventSettings();

  const [localSettings, setLocalSettings] = useState({
    isEventLive: false,
    airportMode: "CUSTOM",
    fixedAirport: "",
    departureMode: "CUSTOM",
    fixedDeparture: "",
    arrivalMode: "CUSTOM",
    fixedArrival: "",
    routeMode: "CUSTOM",
    fixedRoute: "",
    timeMode: "CUSTOM",
    fixedTime: "",
    activeAirports: [] as string[],
    airportData: [] as { id: string; name: string }[],
  });

  // Sync local settings with Convex settings when they load
  useEffect(() => {
    if (convexSettings) {
      setLocalSettings({
        isEventLive: convexSettings.isEventLive ?? false,
        airportMode: convexSettings.airportMode ?? "CUSTOM",
        fixedAirport: convexSettings.fixedAirport ?? "",
        departureMode: convexSettings.departureMode ?? "CUSTOM",
        fixedDeparture: convexSettings.fixedDeparture ?? "",
        arrivalMode: convexSettings.arrivalMode ?? "CUSTOM",
        fixedArrival: convexSettings.fixedArrival ?? "",
        routeMode: convexSettings.routeMode ?? "CUSTOM",
        fixedRoute: convexSettings.fixedRoute ?? "",
        timeMode: convexSettings.timeMode ?? "CUSTOM",
        fixedTime: convexSettings.fixedTime ?? "",
        activeAirports: convexSettings.activeAirports ?? [],
        airportData: (convexSettings.airportData as { id: string; name: string }[]) ?? [],
      });
    }
  }, [convexSettings]);

  useEffect(() => {
    if (searchQuery.length > 1) {
      void searchGlobalAirports(searchQuery).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const toggleAirport = (ap: ExternalAirport) => {
    const isAlreadyActive = localSettings.activeAirports.includes(ap.icao);
    const nextActive = isAlreadyActive
      ? localSettings.activeAirports.filter(id => id !== ap.icao)
      : [...localSettings.activeAirports, ap.icao];

    const nextData = isAlreadyActive
      ? localSettings.airportData.filter(d => d.id !== ap.icao)
      : [...localSettings.airportData, { id: ap.icao, name: ap.name }];

    setLocalSettings({ ...localSettings, activeAirports: nextActive, airportData: nextData });
  };

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      toast.success("Settings saved");
    } catch (e) {
      console.error("Failed to save settings:", e);
      toast.error("Failed to save settings");
    }
  };

  const handleToggleEventLive = async (val: boolean) => {
    setLocalSettings({...localSettings, isEventLive: val});
    try {
      await updateSettings({ isEventLive: val });
      toast.success(val ? "Event is now LIVE!" : "Event is now offline");
    } catch (e: any) {
      toast.error(`Failed to update: ${e.message || "Unknown error"}`);
      setLocalSettings({...localSettings, isEventLive: !val}); // Revert on error
    }
  };

  const renderConfigSection = (title: string, modeKey: string, valKey: string, placeholder: string) => (
    <div className={`p-4 border rounded-lg space-y-4 ${localSettings[modeKey as keyof typeof localSettings] === "FIXED" ? "border-blue-500 bg-blue-900/10" : "border-gray-800"}`}>
      <Label className="text-blue-400">{title}</Label>
      <Select
        value={localSettings[modeKey as keyof typeof localSettings] as string}
        onValueChange={(v) => setLocalSettings({...localSettings, [modeKey]: v})}
      >
        <SelectTrigger className="bg-gray-800 border-gray-700">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="CUSTOM">User Controlled</SelectItem>
          <SelectItem value="FIXED">Locked Value</SelectItem>
        </SelectContent>
      </Select>
      <Input
        placeholder={placeholder}
        value={localSettings[valKey as keyof typeof localSettings] as string || ""}
        onChange={(e) => setLocalSettings({...localSettings, [valKey]: e.target.value.toUpperCase()})}
        disabled={localSettings[modeKey as keyof typeof localSettings] === "CUSTOM"}
        className="bg-gray-800 border-gray-700 disabled:opacity-30"
      />
    </div>
  );

  if (isLoadingSettings || users === undefined) return <Loading />;

  return (
    <div className="px-8 min-h-screen bg-black text-white">
      <Header />
      <div className="flex justify-between items-center mt-8 mb-6">
        <h1 className="text-3xl font-bold">Admin Controls</h1>
        <div className="flex items-center space-x-4 bg-gray-900 p-3 rounded-lg border border-gray-800">
          <Label className="font-bold">Event Live</Label>
          <Switch
            checked={localSettings.isEventLive}
            onCheckedChange={handleToggleEventLive}
          />
        </div>
      </div>

      <Tabs defaultValue="event">
        <TabsList className="bg-gray-900 border-gray-800 mb-6">
          <TabsTrigger value="event">Event Rules</TabsTrigger>
          <TabsTrigger value="users">Controllers</TabsTrigger>
        </TabsList>

        <TabsContent value="event" className="space-y-8">
          <Card className="bg-gray-900 border-gray-800 text-white p-6">
            <h3 className="text-xl font-bold mb-4 text-blue-400">ATC Airport Selection</h3>
            <div className="space-y-6">
              <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-gray-800 border-gray-700 h-12">
                    <Search className="mr-2 h-4 w-4" /> Search Global Database... <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0 bg-gray-900 border-gray-700">
                  <Command shouldFilter={false}>
                    <CommandInput placeholder="Type ICAO or Name..." value={searchQuery} onValueChange={setSearchQuery} />
                    <CommandList>
                      <CommandEmpty>Start typing...</CommandEmpty>
                      <CommandGroup>
                        {searchResults.map((ap) => (
                          <CommandItem key={ap.icao} onSelect={() => toggleAirport(ap)} className="text-white">
                            <Check className={`mr-2 h-4 w-4 ${localSettings.activeAirports.includes(ap.icao) ? "opacity-100" : "opacity-0"}`} />
                            {ap.icao} - {ap.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <RadioGroup
                value={localSettings.airportMode === "FIXED" ? localSettings.fixedAirport : "CUSTOM"}
                onValueChange={(val) => setLocalSettings({
                  ...localSettings,
                  airportMode: val === "CUSTOM" ? "CUSTOM" : "FIXED",
                  fixedAirport: val === "CUSTOM" ? "" : val
                })}
              >
                <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded border border-gray-700">
                  <RadioGroupItem value="CUSTOM" id="custom-atc" />
                  <Label htmlFor="custom-atc" className="flex-grow cursor-pointer text-gray-400">Pilots choose from list below</Label>
                </div>
                {localSettings.airportData.map((ap) => (
                  <div key={ap.id} className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={ap.id} id={ap.id} />
                      <Label htmlFor={ap.id} className="cursor-pointer font-medium">{ap.id} - {ap.name}</Label>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => toggleAirport({ icao: ap.id, name: ap.name })} className="text-red-500">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderConfigSection("Departure Airport", "departureMode", "fixedDeparture", "e.g. OMDB")}
            {renderConfigSection("Arrival Airport", "arrivalMode", "fixedArrival", "e.g. OMDB")}
            {renderConfigSection("Departure Time", "timeMode", "fixedTime", "e.g. 1800")}
            {renderConfigSection("Flight Route", "routeMode", "fixedRoute", "e.g. DCT VOR STAR")}
          </div>

          <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold">
            Push Config to Live Site
          </Button>
        </TabsContent>

        <TabsContent value="users">
          <UserList users={users} onToggleController={async (userId: Id<"users">) => { await toggleController({ userId }); }} currentUserId={convexUser?._id} />
        </TabsContent>
      </Tabs>
      <Footer />
    </div>
  );
}
