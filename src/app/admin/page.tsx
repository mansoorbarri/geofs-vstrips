"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { UserList } from "~/components/user-list";
import Footer from "~/components/footer";
import Loading from "~/components/loading";
import Header from "~/components/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { toast } from "sonner";
import { searchGlobalAirports, type ExternalAirport } from "~/lib/fetch-airports";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn, user } = useUser();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExternalAirport[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [settings, setSettings] = useState({
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

  useEffect(() => {
    if (searchQuery.length > 1) {
     void searchGlobalAirports(searchQuery).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchData = async () => {
    try {
      const [uRes, sRes] = await Promise.all([fetch("/api/users"), fetch("/api/admin/settings")]);
      if (uRes.ok) setUsers(await uRes.json());
      if (sRes.ok) {
        const sData = await sRes.json();
        setSettings({ ...sData, airportData: sData.airportData ?? [], activeAirports: sData.activeAirports ?? [] });
      }
    } catch (e) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      void fetchData();
    }
  }, [authLoaded, isSignedIn]);

  const toggleAirport = (ap: ExternalAirport) => {
    const isAlreadyActive = settings.activeAirports.includes(ap.icao);
    const nextActive = isAlreadyActive 
      ? settings.activeAirports.filter(id => id !== ap.icao)
      : [...settings.activeAirports, ap.icao];

    const nextData = isAlreadyActive
      ? settings.airportData.filter(d => d.id !== ap.icao)
      : [...settings.airportData, { id: ap.icao, name: ap.name }];

    setSettings({ ...settings, activeAirports: nextActive, airportData: nextData });
  };

  const handleSave = async () => {
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) toast.success("Settings saved");
  };

  const renderConfigSection = (title: string, modeKey: string, valKey: string, placeholder: string) => (
    <div className={`p-4 border rounded-lg space-y-4 ${settings[modeKey as keyof typeof settings] === "FIXED" ? "border-blue-500 bg-blue-900/10" : "border-gray-800"}`}>
      <Label className="text-blue-400">{title}</Label>
      <Select value={settings[modeKey as keyof typeof settings] as string} onValueChange={(v) => setSettings({...settings, [modeKey]: v})}>
        <SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="CUSTOM">User Controlled</SelectItem><SelectItem value="FIXED">Locked Value</SelectItem></SelectContent>
      </Select>
      <Input placeholder={placeholder} value={settings[valKey as keyof typeof settings] as string || ""} onChange={(e) => setSettings({...settings, [valKey]: e.target.value.toUpperCase()})} disabled={settings[modeKey as keyof typeof settings] === "CUSTOM"} className="bg-gray-800 border-gray-700 disabled:opacity-30" />
    </div>
  );

  if (!authLoaded || isLoading) return <Loading />;

  return (
    <div className="px-8 min-h-screen bg-black text-white">
      <Header />
      <div className="flex justify-between items-center mt-8 mb-6">
        <h1 className="text-3xl font-bold">Admin Controls</h1>
        <div className="flex items-center space-x-4 bg-gray-900 p-3 rounded-lg border border-gray-800">
          <Label className="font-bold">Event Live</Label>
          <Switch checked={settings.isEventLive} onCheckedChange={(val) => setSettings({...settings, isEventLive: val})} />
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
                      <CommandEmpty>Start typing to search...</CommandEmpty>
                      <CommandGroup>
                        {searchResults.map((ap) => (
                          <CommandItem key={ap.icao} onSelect={() => toggleAirport(ap)} className="text-white">
                            <Check className={`mr-2 h-4 w-4 ${settings.activeAirports.includes(ap.icao) ? "opacity-100" : "opacity-0"}`} /> {ap.icao} - {ap.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <RadioGroup value={settings.airportMode === "FIXED" ? settings.fixedAirport : "CUSTOM"} onValueChange={(val) => setSettings({ ...settings, airportMode: val === "CUSTOM" ? "CUSTOM" : "FIXED", fixedAirport: val === "CUSTOM" ? "" : val })}>
                <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded border border-gray-700">
                  <RadioGroupItem value="CUSTOM" id="custom-atc" /> <Label htmlFor="custom-atc" className="flex-grow cursor-pointer text-gray-400">Pilots choose from list below</Label>
                </div>
                {settings.airportData.map((ap) => (
                  <div key={ap.id} className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={ap.id} id={ap.id} /> <Label htmlFor={ap.id} className="cursor-pointer font-medium">{ap.id} - {ap.name}</Label>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => toggleAirport({ icao: ap.id, name: ap.name })} className="text-red-500"><X className="h-4 w-4" /></Button>
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
          <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold">Push Config to Live Site</Button>
        </TabsContent>
        <TabsContent value="users"><UserList users={users} onRoleChange={fetchData} currentUserId={user?.id || ""} /></TabsContent>
      </Tabs>
      <Footer />
    </div>
  );
}