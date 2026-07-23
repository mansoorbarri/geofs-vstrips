"use client";

import { useState, useEffect } from "react";
import { UserList } from "~/components/user-list";
import { AdminUserList } from "~/components/admin-user-list";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { toast } from "sonner";
import {
  searchGlobalAirports,
  type ExternalAirport,
} from "~/lib/fetch-airports";
import { useEventSettings } from "~/hooks/use-event-settings";
import { getFriendlyError } from "~/lib/friendly-error";
import type { ControlledFilingRule } from "~/lib/controlled-filing";

const defaultControlledRule = (airport: string): ControlledFilingRule => ({
  airport,
  filesPerSlot: 1,
  intervalMinutes: 5,
  startTime: "1200",
  endTime: "1800",
  timeType: "ETD",
});

const toZuluTime = (value: string) => value.replace(/\D/g, "").slice(0, 4);
const isZuluTime = (value: string) => /^([01]\d|2[0-3])[0-5]\d$/.test(value);

export function AdminDashboardClient() {
  const { user: convexUser } = useCurrentUser();
  const users = useQuery(api.users.list);
  const toggleController = useMutation(api.users.toggleController);
  const toggleAdmin = useMutation(api.users.toggleAdmin);
  const isSuperAdmin = Boolean(
    convexUser?.isAdmin &&
      convexUser?.email &&
      process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL &&
      convexUser.email.toLowerCase().trim() ===
        process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL.toLowerCase().trim(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExternalAirport[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const {
    settings: convexSettings,
    isLoading: isLoadingSettings,
    updateSettings,
  } = useEventSettings();

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
    altitudeMode: "CUSTOM",
    fixedAltitude: "",
    speedMode: "CUSTOM",
    fixedSpeed: "",
    activeAirports: [] as string[],
    airportData: [] as { id: string; name: string }[],
    filingMode: "OPEN" as "OPEN" | "CONTROLLED",
    controlledFilingRules: [] as ControlledFilingRule[],
    controlledFilingRulesSynced: false,
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
        altitudeMode: convexSettings.altitudeMode ?? "CUSTOM",
        fixedAltitude: convexSettings.fixedAltitude ?? "",
        speedMode: convexSettings.speedMode ?? "CUSTOM",
        fixedSpeed: convexSettings.fixedSpeed ?? "",
        activeAirports: convexSettings.activeAirports ?? [],
        airportData:
          (convexSettings.airportData as { id: string; name: string }[]) ?? [],
        filingMode: convexSettings.filingMode ?? "OPEN",
        controlledFilingRules: convexSettings.controlledFilingRules ?? [],
        controlledFilingRulesSynced:
          convexSettings.controlledFilingRulesSynced ?? false,
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
      ? localSettings.activeAirports.filter((id) => id !== ap.icao)
      : [...localSettings.activeAirports, ap.icao];

    const nextData = isAlreadyActive
      ? localSettings.airportData.filter((d) => d.id !== ap.icao)
      : [...localSettings.airportData, { id: ap.icao, name: ap.name }];

    setLocalSettings({
      ...localSettings,
      activeAirports: nextActive,
      airportData: nextData,
      controlledFilingRules: isAlreadyActive
        ? localSettings.controlledFilingRules.filter(
            (rule) => rule.airport !== ap.icao,
          )
        : localSettings.controlledFilingRules,
    });
  };

  const handleSave = async () => {
    const controlledFilingRules = localSettings.airportData.map((airport) => {
      const rule = localSettings.controlledFilingRules.find(
        (item) => item.airport === airport.id,
      );
      return rule ?? defaultControlledRule(airport.id);
    });
    if (
      localSettings.filingMode === "CONTROLLED" &&
      controlledFilingRules.some(
        (rule) =>
          !isZuluTime(rule.startTime) ||
          !isZuluTime(rule.endTime) ||
          rule.startTime > rule.endTime,
      )
    ) {
      toast.error(
        "Use valid four-digit Zulu times (0000–2359), with an end time after its start time.",
      );
      return;
    }
    const finalRules = localSettings.controlledFilingRulesSynced
      ? controlledFilingRules.map((rule) => ({
          ...controlledFilingRules[0],
          airport: rule.airport,
        }))
      : controlledFilingRules;
    try {
      await updateSettings({
        ...localSettings,
        controlledFilingRules: finalRules,
      });
      setLocalSettings({ ...localSettings, controlledFilingRules: finalRules });
      toast.success("Settings saved");
    } catch (e: unknown) {
      console.error("Failed to save settings:", e);
      toast.error(getFriendlyError(e, "Failed to save settings."));
    }
  };

  const handleToggleEventLive = async (val: boolean) => {
    setLocalSettings({ ...localSettings, isEventLive: val });
    try {
      await updateSettings({ isEventLive: val });
      toast.success(val ? "Event is now LIVE!" : "Event is now offline");
    } catch (e: unknown) {
      toast.error(getFriendlyError(e, "Failed to update event status."));
      setLocalSettings({ ...localSettings, isEventLive: !val }); // Revert on error
    }
  };

  const updateControlledRule = (
    airport: string,
    patch: Partial<ControlledFilingRule>,
  ) => {
    const existing = localSettings.controlledFilingRules.find(
      (rule) => rule.airport === airport,
    );
    const nextRule: ControlledFilingRule = {
      ...defaultControlledRule(airport),
      ...existing,
      ...patch,
    };
    const controlledFilingRules = localSettings.controlledFilingRulesSynced
      ? localSettings.airportData.map((item) => ({
          ...nextRule,
          airport: item.id,
        }))
      : [
          ...localSettings.controlledFilingRules.filter(
            (rule) => rule.airport !== airport,
          ),
          nextRule,
        ];
    setLocalSettings({
      ...localSettings,
      controlledFilingRules,
    });
  };

  const toggleScheduleSync = () => {
    const nextSynced = !localSettings.controlledFilingRulesSynced;
    const source =
      localSettings.controlledFilingRules[0] ??
      defaultControlledRule(localSettings.airportData[0]?.id ?? "");
    setLocalSettings({
      ...localSettings,
      controlledFilingRulesSynced: nextSynced,
      controlledFilingRules: nextSynced
        ? localSettings.airportData.map((airport) => ({
            ...source,
            airport: airport.id,
          }))
        : localSettings.controlledFilingRules,
    });
  };

  const renderConfigSection = (
    title: string,
    modeKey: string,
    valKey: string,
    placeholder: string,
    transformValue: (value: string) => string = (value) => value.toUpperCase(),
  ) => (
    <div
      className={`space-y-4 rounded-lg border p-4 ${localSettings[modeKey as keyof typeof localSettings] === "FIXED" ? "border-blue-500 bg-blue-900/10" : "border-gray-800"}`}
    >
      <Label className="text-blue-400">{title}</Label>
      <Select
        value={localSettings[modeKey as keyof typeof localSettings] as string}
        onValueChange={(v) =>
          setLocalSettings({ ...localSettings, [modeKey]: v })
        }
      >
        <SelectTrigger className="border-gray-700 bg-gray-800">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="CUSTOM">User Controlled</SelectItem>
          <SelectItem value="FIXED">Locked Value</SelectItem>
        </SelectContent>
      </Select>
      <Input
        placeholder={placeholder}
        value={
          (localSettings[valKey as keyof typeof localSettings] as string) || ""
        }
        onChange={(e) =>
          setLocalSettings({
            ...localSettings,
            [valKey]: transformValue(e.target.value),
          })
        }
        disabled={
          localSettings[modeKey as keyof typeof localSettings] === "CUSTOM"
        }
        className="border-gray-700 bg-gray-800 disabled:opacity-30"
      />
    </div>
  );

  if (isLoadingSettings || users === undefined) return <Loading />;

  return (
    <div className="min-h-screen bg-black px-8 text-white">
      <Header />
      <div className="mt-8 mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Controls</h1>
        <div className="flex items-center space-x-4 rounded-lg border border-gray-800 bg-gray-900 p-3">
          <Label className="font-bold">Event Live</Label>
          <Switch
            checked={localSettings.isEventLive}
            onCheckedChange={handleToggleEventLive}
          />
        </div>
      </div>

      <Tabs defaultValue="event">
        <TabsList className="mb-6 border-gray-800 bg-gray-900">
          <TabsTrigger value="event">Event Rules</TabsTrigger>
          <TabsTrigger value="users">Controllers</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="admins">Admins</TabsTrigger>}
        </TabsList>

        <TabsContent value="event" className="space-y-8">
          <Card className="border-gray-800 bg-gray-900 p-6 text-white">
            <h3 className="mb-4 text-xl font-bold text-blue-400">
              ATC Airport Selection
            </h3>
            <div className="space-y-6">
              <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 w-full justify-between border-gray-700 bg-gray-800"
                  >
                    <Search className="mr-2 h-4 w-4" /> Search Global
                    Database...{" "}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] border-gray-700 bg-gray-900 p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Type ICAO or Name..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>Start typing...</CommandEmpty>
                      <CommandGroup>
                        {searchResults.map((ap) => (
                          <CommandItem
                            key={ap.icao}
                            onSelect={() => toggleAirport(ap)}
                            className="text-white"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${localSettings.activeAirports.includes(ap.icao) ? "opacity-100" : "opacity-0"}`}
                            />
                            {ap.icao} - {ap.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <RadioGroup
                value={
                  localSettings.airportMode === "FIXED"
                    ? localSettings.fixedAirport
                    : "CUSTOM"
                }
                onValueChange={(val) =>
                  setLocalSettings({
                    ...localSettings,
                    airportMode: val === "CUSTOM" ? "CUSTOM" : "FIXED",
                    fixedAirport: val === "CUSTOM" ? "" : val,
                  })
                }
              >
                <div className="flex items-center space-x-3 rounded border border-gray-700 bg-gray-800 p-3">
                  <RadioGroupItem value="CUSTOM" id="custom-atc" />
                  <Label
                    htmlFor="custom-atc"
                    className="flex-grow cursor-pointer text-gray-400"
                  >
                    Pilots choose from list below
                  </Label>
                </div>
                {localSettings.airportData.map((ap) => (
                  <div
                    key={ap.id}
                    className="flex items-center justify-between rounded border border-gray-700 bg-gray-800 p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={ap.id} id={ap.id} />
                      <Label
                        htmlFor={ap.id}
                        className="cursor-pointer font-medium"
                      >
                        {ap.id} - {ap.name}
                      </Label>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        toggleAirport({ icao: ap.id, name: ap.name })
                      }
                      className="text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </Card>

          <Card className="border-gray-800 bg-gray-900 p-6 text-white">
            <h3 className="text-xl font-bold text-blue-400">
              Flight Filing Availability
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Open filing lets pilots choose any valid time. Controlled filing
              creates per-airport time slots and caps each slot.
            </p>
            <RadioGroup
              className="mt-5 grid gap-3 md:grid-cols-2"
              value={localSettings.filingMode}
              onValueChange={(value: "OPEN" | "CONTROLLED") =>
                setLocalSettings({ ...localSettings, filingMode: value })
              }
            >
              <div className="flex items-center gap-3 rounded border border-gray-700 bg-gray-800 p-4">
                <RadioGroupItem value="OPEN" id="filing-open" />
                <Label htmlFor="filing-open" className="cursor-pointer">
                  <span className="block font-medium">Willy-nilly filing</span>
                  <span className="text-sm font-normal text-gray-400">
                    No capacity or time restrictions.
                  </span>
                </Label>
              </div>
              <div className="flex items-center gap-3 rounded border border-blue-900 bg-blue-950/30 p-4">
                <RadioGroupItem value="CONTROLLED" id="filing-controlled" />
                <Label htmlFor="filing-controlled" className="cursor-pointer">
                  <span className="block font-medium">Controlled filing</span>
                  <span className="text-sm font-normal text-gray-400">
                    Pilots pick from available ETD/ETA slots.
                  </span>
                </Label>
              </div>
            </RadioGroup>

            {localSettings.filingMode === "CONTROLLED" && (
              <div className="mt-5 space-y-4">
                {localSettings.airportData.length === 0 ? (
                  <p className="rounded border border-amber-900 bg-amber-950/30 p-3 text-sm text-amber-200">
                    Add at least one ATC airport above before setting a filing
                    schedule.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-900/70 bg-blue-950/20 px-4 py-3">
                      <div>
                        <p className="font-medium text-blue-100">
                          {localSettings.controlledFilingRulesSynced
                            ? "Schedules are synced"
                            : "Schedules are independent"}
                        </p>
                        <p className="text-sm text-blue-200/70">
                          {localSettings.controlledFilingRulesSynced
                            ? "Changes below apply to every airport."
                            : "Each airport can have its own capacity and time range."}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={toggleScheduleSync}
                        className="border-blue-700 bg-blue-950/50 hover:bg-blue-900"
                      >
                        {localSettings.controlledFilingRulesSynced
                          ? "Un-sync schedules"
                          : "Sync all schedules"}
                      </Button>
                    </div>
                    {(localSettings.controlledFilingRulesSynced
                      ? localSettings.airportData.slice(0, 1)
                      : localSettings.airportData
                    ).map((airport) => {
                      const rule =
                        localSettings.controlledFilingRules.find(
                          (item) => item.airport === airport.id,
                        ) ?? defaultControlledRule(airport.id);
                      return (
                        <div
                          key={airport.id}
                          className="rounded-lg border border-gray-700 bg-black/30 p-4"
                        >
                          <div className="mb-3 font-semibold">
                            {localSettings.controlledFilingRulesSynced
                              ? "All airports"
                              : airport.id}{" "}
                            <span className="font-normal text-gray-400">
                              —{" "}
                              {localSettings.controlledFilingRulesSynced
                                ? `${localSettings.airportData.length} schedules share this configuration`
                                : airport.name}
                            </span>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            <div>
                              <Label
                                htmlFor={`${airport.id}-capacity`}
                                className="text-xs text-gray-400"
                              >
                                Files per time
                              </Label>
                              <Input
                                id={`${airport.id}-capacity`}
                                type="number"
                                min="1"
                                value={rule.filesPerSlot}
                                onChange={(e) =>
                                  updateControlledRule(airport.id, {
                                    filesPerSlot: Math.max(
                                      1,
                                      Number(e.target.value),
                                    ),
                                  })
                                }
                                className="mt-1 bg-gray-800"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor={`${airport.id}-interval`}
                                className="text-xs text-gray-400"
                              >
                                Every (minutes)
                              </Label>
                              <Input
                                id={`${airport.id}-interval`}
                                type="number"
                                min="1"
                                value={rule.intervalMinutes}
                                onChange={(e) =>
                                  updateControlledRule(airport.id, {
                                    intervalMinutes: Math.max(
                                      1,
                                      Number(e.target.value),
                                    ),
                                  })
                                }
                                className="mt-1 bg-gray-800"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor={`${airport.id}-start`}
                                className="text-xs text-gray-400"
                              >
                                Start time (Zulu)
                              </Label>
                              <Input
                                id={`${airport.id}-start`}
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="1200"
                                value={rule.startTime}
                                onChange={(e) =>
                                  updateControlledRule(airport.id, {
                                    startTime: toZuluTime(e.target.value),
                                  })
                                }
                                className="mt-1 bg-gray-800 font-mono"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor={`${airport.id}-end`}
                                className="text-xs text-gray-400"
                              >
                                End time (Zulu)
                              </Label>
                              <Input
                                id={`${airport.id}-end`}
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="1800"
                                value={rule.endTime}
                                onChange={(e) =>
                                  updateControlledRule(airport.id, {
                                    endTime: toZuluTime(e.target.value),
                                  })
                                }
                                className="mt-1 bg-gray-800 font-mono"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-400">
                                Pilot sees
                              </Label>
                              <div className="mt-1 grid grid-cols-2 rounded-md border border-gray-700 bg-gray-800 p-1">
                                {(["ETD", "ETA"] as const).map((timeType) => (
                                  <Button
                                    key={timeType}
                                    type="button"
                                    size="sm"
                                    variant={
                                      rule.timeType === timeType
                                        ? "default"
                                        : "ghost"
                                    }
                                    onClick={() =>
                                      updateControlledRule(airport.id, {
                                        timeType,
                                      })
                                    }
                                    className={
                                      rule.timeType === timeType
                                        ? "bg-blue-600 hover:bg-blue-500"
                                        : "text-gray-400 hover:text-white"
                                    }
                                  >
                                    {timeType}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {renderConfigSection(
              "Departure Airport",
              "departureMode",
              "fixedDeparture",
              "e.g. OMDB",
            )}
            {renderConfigSection(
              "Arrival Airport",
              "arrivalMode",
              "fixedArrival",
              "e.g. OMDB",
            )}
            {renderConfigSection(
              "Departure Time",
              "timeMode",
              "fixedTime",
              "e.g. 1800",
            )}
            {renderConfigSection(
              "Cruise Altitude",
              "altitudeMode",
              "fixedAltitude",
              "e.g. FL350",
            )}
            {renderConfigSection(
              "Cruise Speed",
              "speedMode",
              "fixedSpeed",
              "e.g. 0.82",
              (value) => value,
            )}
            {renderConfigSection(
              "Flight Route",
              "routeMode",
              "fixedRoute",
              "e.g. DCT VOR STAR",
            )}
          </div>

          <Button
            onClick={handleSave}
            className="h-14 w-full bg-blue-600 text-lg font-bold hover:bg-blue-700"
          >
            Push Config to Live Site
          </Button>
        </TabsContent>

        <TabsContent value="users">
          <UserList
            users={users}
            onToggleController={async (userId: Id<"users">) => {
              await toggleController({ userId });
            }}
            currentUserId={convexUser?._id}
          />
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="admins">
            <AdminUserList
              users={users}
              onToggleAdmin={async (userId: Id<"users">) => {
                await toggleAdmin({ userId });
              }}
              currentUserId={convexUser?._id}
            />
          </TabsContent>
        )}
      </Tabs>
      <Footer />
    </div>
  );
}
