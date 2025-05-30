import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Check, ChevronRight, ChevronLeft, ClipboardList, Bot, Upload, Mail, Phone, MapPin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { httpFile } from "../../config.js";
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
export function CreateProject() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [wantImages, setWantImages] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(0);
  const [loadingLocalAreas, setLoadingLocalAreas] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const storedLastId = localStorage.getItem("lastCreateProjectId");
  const navProjectId = location.state?.projectId;
  const [projectId, setProjectId] = useState(navProjectId || storedLastId || null);

  const draftKey = projectId || "new";
  const lastSubKey = projectId ? `createProjectLastSubmitted:${projectId}` : null;

  // Location selection states
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<Country[]>([]);
  // With these:
  interface Country {
    countryId?: string; // Optional for manual countries
    name: string;
    status: number; // 0 or 1 to indicate "Create page" checkbox
  }

  interface State {
    id?: string; // Optional for API-fetched states
    name: string; // The display name of the state
    country_id?: string; // Optional, used for API-fetched states
    manual?: boolean; // Optional, to mark manual states
    status: number; // 0 or 1 to indicate "Create page" checkbox
  }

  interface City {
    id?: string; // Optional for API-fetched cities
    name: string;
    state_id?: string; // Optional, links to state
    manual?: boolean; // Marks manual cities
    status: number; // 0 or 1 for "Create page"
  }

  const [countrySearchInput, setCountrySearchInput] = useState("");
  const [currentCountryPage, setCurrentCountryPage] = useState(1);
  const countriesPerPage = 10;

  // Page creation for countries

  // States management

  const [selectedStates, setSelectedStates] = useState<{ [country: string]: string[] }>({});
  const [stateInput, setStateInput] = useState<{ [country: string]: string }>({});
  const [statesByCountry, setStatesByCountry] = useState({});

  const [loadingStates, setLoadingStates] = useState<boolean>(false); // To show loading state


  // Cities management
  const [citiesByState, setCitiesByState] = useState<{ [state: string]: City[] }>({});
  const [selectedCities, setSelectedCities] = useState<{ [state: string]: string[] }>({});
  const [cityInput, setCityInput] = useState<{ [state: string]: string }>({});

  // Local areas management
  const [localAreas, setLocalAreas] = useState<{ [city: string]: { id: string; name: string }[] }>({});
  const [localAreaInput, setLocalAreaInput] = useState<{ [city: string]: string }>({});

  // Service states

  const [serviceOption, setServiceOption] = useState<"manual" | "ai" | "">("");
  const [serviceNames, setServiceNames] = useState("");

  // About Us states
  const [aboutUsEmail, setAboutUsEmail] = useState("");
  const [aboutUsPhone, setAboutUsPhone] = useState("");
  const [aboutUsLocation, setAboutUsLocation] = useState("");

  // Final success state
  const [showFinalSuccess, setShowFinalSuccess] = useState(false);
  const [redirectCounter, setRedirectCounter] = useState(7);

  // Page creation option - removed from here, now managed per country

  const fetchStatesForCountry = async (countryId: string) => {
    setLoadingStates(true);
    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.get("/fetch_states", {
        headers: { Authorization: `Bearer ${token}` },
        params: { country_ids: countryId },
      });

      console.log("FetchStates Response:", {
        countryId,
        status: res.status,
        data: res.data,
      });

      const states: State[] = res.data.data?.map((item: any) => ({
        id: item.id,
        name: item.name,
        country_id: countryId,
        status: item.status !== undefined ? item.status : 0,
      })) || [];
      setStatesByCountry((prev) => ({
        ...prev,
        [countryId]: states,
      }));
    } catch (err: any) {
      console.error("FetchStates Error:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to fetch states.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(false);
    }
  };


useEffect(() => {
  if (step === 4 && projectId) {
    const fetchCitiesForStep4 = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await httpFile.post(
          "/my_site",
          { projectId, pageType: "home" },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.status === 200) {
          const projectData = res.data.projectInfo || {};
          const cityArr = projectData.locations?.city || [];

          const newSelectedCities: { [state: string]: string[] } = {};

          // Initialize selected cities from API response
          cityArr.forEach((city: any) => {
            const country = selectedCountries.find((c) =>
              statesByCountry[c.countryId]?.some((s: State) => s.id === city.stateId)
            );
            if (!country || !country.countryId) return;

            const state = statesByCountry[country.countryId]?.find((s: State) => s.id === city.stateId);
            const stateName = state?.name || "Unknown";

            if (!newSelectedCities[stateName]) {
              newSelectedCities[stateName] = [];
            }
            if (!newSelectedCities[stateName].includes(city.name)) {
              newSelectedCities[stateName].push(city.name);
            }
          });

          setSelectedCities((prev) => ({ ...prev, ...newSelectedCities }));
        }
      } catch (error) {
        console.error("FetchCitiesForStep4 Error:", error);
        toast({
          title: "Error",
          description: "Failed to fetch cities for Step 4",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCitiesForStep4();
  }
}, [step, projectId, selectedCountries, statesByCountry]);

  const fetchCitiesForState = async (stateId: string, stateName: string, search: string = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.get("/fetch_cities", {
        headers: { Authorization: `Bearer ${token}` },
        params: { state_ids: stateId, search },
      });

      console.log("FetchCities Response:", {
        stateId,
        stateName,
        status: res.status,
        data: res.data,
      });

      const cities: City[] = res.data.data?.map((item: any) => ({
        id: item.id,
        name: item.name,
        state_id: stateId,
        manual: false,
        status: item.status !== undefined ? item.status : 0,
      })) || [];

      // Deduplicate cities based on name
      setCitiesByState((prev) => {
        const existingCities = prev[stateName] || [];
        const newCities = cities.filter(
          (city) => !existingCities.some((c: City) => c.name === city.name)
        );
        return {
          ...prev,
          [stateName]: [...existingCities, ...newCities],
        };
      });

      // Update selectedCities, avoiding duplicates
      setSelectedCities((prev) => {
        const currentCities = prev[stateName] || [];
        const newSelected = cities
          .map((city) => city.name)
          .filter((cityName) => !currentCities.includes(cityName));
        return {
          ...prev,
          [stateName]: [...currentCities, ...newSelected],
        };
      });
    } catch (err: any) {
      console.error("FetchCities Error:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to fetch cities.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const fetchProjectDetails = async () => {
    setLoadingLocalAreas(true);
    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.post(
        "/my_site",
        { projectId, pageType: "home" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) {
        toast({
          title: "Error",
          description: "Invalid token",
          variant: "destructive",
        });
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (res.status === 200) {
        const projectData = res.data.projectInfo || {};
        const cityArr = projectData.locations?.city || [];
        const localsArr = projectData.locations?.localArea || [];

        // Initialize citiesByState and selectedCities
        const newCitiesByState: { [state: string]: City[] } = {};
        const newSelectedCities: { [state: string]: string[] } = {};

        // Map cities to their states
        cityArr.forEach((city: any) => {
          // Find the country that contains the state
          const country = selectedCountries.find((c) =>
            statesByCountry[c.countryId]?.some((s: State) => s.id === city.stateId)
          );
          if (!country || !country.countryId) return; // Skip if country not found

          const state = statesByCountry[country.countryId]?.find((s: State) => s.id === city.stateId);
          const stateName = state?.name || "Unknown";

          if (!newCitiesByState[stateName]) {
            newCitiesByState[stateName] = [];
            newSelectedCities[stateName] = [];
          }
          const cityObj: City = {
            id: city.cityId,
            name: city.name,
            state_id: city.stateId,
            manual: false,
            status: city.status || 0,
          };
          newCitiesByState[stateName].push(cityObj);
          // Only add to selectedCities if it doesn't already exist
          if (!newSelectedCities[stateName].includes(city.name)) {
            newSelectedCities[stateName].push(city.name);
          }
        });
        setCitiesByState((prev) => ({ ...prev, ...newCitiesByState }));
        setSelectedCities((prev) => {
          const updated = { ...prev };
          Object.entries(newSelectedCities).forEach(([stateName, cities]) => {
            updated[stateName] = [
              ...(updated[stateName] || []),
              ...cities.filter((city) => !(updated[stateName] || []).includes(city)), // Avoid duplicates
            ];
          });
          return updated;
        });

        // Initialize localAreas and localAreaInput
        const initialInputs: { [city: string]: string } = {};
        const initialLocals: { [city: string]: { id: string; name: string }[] } = {};

        if (cityArr.length > 0) {
          cityArr.forEach((city: any) => {
            const cityName = city.name;
            initialInputs[cityName] = "";
            initialLocals[cityName] = [];
          });
        } else {
          initialInputs["all"] = "";
          initialLocals["all"] = [];
        }

        localsArr.forEach((local: any) => {
          const cityName = cityArr.find((c: any) => c.cityId === local.cityId)?.name || "all";
          if (!(cityName in initialLocals)) {
            initialLocals[cityName] = [];
            initialInputs[cityName] = "";
          }
          initialLocals[cityName].push({
            id: local._id || Date.now().toString(),
            name: local.name,
          });
        });

        setLocalAreaInput(initialInputs);
        setLocalAreas(initialLocals);
      }
    } catch (error) {
      console.error("FetchProjectDetails Error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch project details",
        variant: "destructive",
      });
      setLocalAreaInput({ all: "" });
      setLocalAreas({ all: [] });
    } finally {
      setLoadingLocalAreas(false);
    }
  };


  useEffect(() => {
    if (step === 5 && projectId) {
      fetchProjectDetails();
    }
  }, [step, projectId]);

  const handleCountryClick = (countryId: string) => {
    if (!statesByCountry[countryId]) {
      fetchStatesForCountry(countryId);
    }
  };

  const loadstates = async (countryId: string) => {
    setLoadingStates(true);
    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.get("/fetch_states", {
        headers: { Authorization: `Bearer ${token}` },
        params: { country_ids: countryId },
      });

      const states: State[] = res.data.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        country_id: countryId,
        status: item.status !== undefined ? item.status : 0, // Use API status if provided, else 0
      }));
      setStatesByCountry((prev) => ({
        ...prev,
        [countryId]: states,
      }));
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch states.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(false);
    }
  };

  const handleStateKeyDown = (countryName: string, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && stateInput[countryName]?.trim() !== "") {
      const newStateName = stateInput[countryName].trim();
      const country = selectedCountries.find((c) => c.name === countryName);
      if (!country) return; // Safety check
      const countryId = country.countryId; // Use countryId from selectedCountries

      if (!countryId) {
        toast({
          title: "Error",
          description: "Country ID is missing. Please ensure countries are saved correctly.",
          variant: "destructive",
        });
        return;
      }

      // Add manual state
      const newState: State = { name: newStateName, manual: true, status: 0, country_id: countryId };
      setStatesByCountry((prev) => ({
        ...prev,
        [countryId]: [...(prev[countryId] || []), newState],
      }));

      // Update selected states
      setSelectedStates((prev) => ({
        ...prev,
        [countryName]: [...(prev[countryName] || []), newStateName],
      }));

      setStateInput({ ...stateInput, [countryName]: "" });
    }
  };
  const toggleStatePageCreation = (countryName: string, stateName: string) => {
    const country = selectedCountries.find((c) => c.name === countryName);
    if (!country || !country.countryId) return; // Safety check
    const countryId = country.countryId;
    setStatesByCountry((prev) => ({
      ...prev,
      [countryId]: prev[countryId].map((state: State) =>
        state.name === stateName
          ? { ...state, status: state.status === 1 ? 0 : 1 }
          : state
      ),
    }));
  };

  const toggleCityPageCreation = (stateName: string, cityName: string) => {
    setCitiesByState((prev) => ({
      ...prev,
      [stateName]: prev[stateName].map((city: City) =>
        city.name === cityName
          ? { ...city, status: city.status === 1 ? 0 : 1 }
          : city
      ),
    }));
  };


  useEffect(() => {
    async function fetchCountries() {
      try {
        const token = localStorage.getItem("token");
        const res = await httpFile.get("/fetch_countries", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Map API response to Country interface
        const countryList = res.data.data.map((item: any) => ({
          countryId: item.id,
          name: item.name,
          status: 0, // Initialize status as 0 (checkbox unchecked)
        }));
        console.log(countryList, "list of countries");
        setCountries(countryList);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch countries.",
          variant: "destructive",
        });
      }
    }
    fetchCountries();
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(`createProjectDraft:${draftKey}`);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        if (d.serviceType) setServiceType(d.serviceType);
        if (d.projectName) setProjectName(d.projectName);
        if (typeof d.wantImages === "boolean") setWantImages(d.wantImages);
      } catch { }
    }
  }, [draftKey]);

  useEffect(() => {
    localStorage.setItem(
      `createProjectDraft:${draftKey}`,
      JSON.stringify({ serviceType, projectName, wantImages, projectId })
    );
  }, [serviceType, projectName, wantImages, projectId, draftKey]);

  useEffect(() => {
    console.log("Project Name Updated: ", projectName);
  }, [projectName]);

  useEffect(() => {
    console.log("Service Type Updated: ", serviceType);
  }, [serviceType]);

  // Redirect countdown effect
  useEffect(() => {
    if (showFinalSuccess && redirectCounter > 0) {
      const timer = setTimeout(() => {
        setRedirectCounter(redirectCounter - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (showFinalSuccess && redirectCounter === 0) {
      navigate("/admin/Project_listing");
    }
  }, [showFinalSuccess, redirectCounter, navigate]);


  useEffect(() => {
    if (showFinalSuccess && redirectCounter > 0) {
      const timer = setTimeout(() => {
        setRedirectCounter(redirectCounter - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (showFinalSuccess && redirectCounter === 0) {
      navigate("/admin/Project_listing");
    }
  }, [showFinalSuccess, redirectCounter, navigate]);

  // Step 1: Reload Project Details
  useEffect(() => {
    if (step === 1 && projectId) {
      const fetchProjectDetailsForStep1 = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await httpFile.post(
            "/my_site",
            { projectId, pageType: "home" },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.status === 200) {
            const projectData = res.data.projectInfo || {};
            setProjectName(projectData.projectName || "");
            setServiceType(projectData.serviceType || "");
            setWantImages(projectData.wantImages === 1);
          }
        } catch (error) {
          console.error("FetchProjectDetailsForStep1 Error:", error);
          toast({
            title: "Error",
            description: "Failed to fetch project details for Step 1",
            variant: "destructive",
          });
        }
      };

      fetchProjectDetailsForStep1();
    }
  }, [step, projectId]);

  // Step 2: Reload Countries
  useEffect(() => {
    if (step === 2 && projectId) {
      const fetchCountriesForStep2 = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await httpFile.post(
            "/my_site",
            { projectId, pageType: "home" },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.status === 200) {
            const projectData = res.data.projectInfo || {};
            const countryArr = projectData.locations?.country || [];
            const updatedCountries = countryArr.map((item: any) => ({
              countryId: item.countryId,
              name: item.name,
              status: item.status || 0,
            }));
            setSelectedCountries(updatedCountries);
          }
        } catch (error) {
          console.error("FetchCountriesForStep2 Error:", error);
          toast({
            title: "Error",
            description: "Failed to fetch countries for Step 2",
            variant: "destructive",
          });
        }
      };

      fetchCountriesForStep2();
    }
  }, [step, projectId]);

  // Step 3: Reload States
useEffect(() => {
  if (step === 3 && projectId) {
    const fetchStatesForStep3 = async () => {
      setLoadingStates(true);
      try {
        const token = localStorage.getItem("token");
        const res = await httpFile.post(
          "/my_site",
          { projectId, pageType: "home" },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.status === 200) {
          const projectData = res.data.projectInfo || {};
          const stateArr = projectData.locations?.state || [];

          const newSelectedStates: { [country: string]: string[] } = {};

          // Initialize selected states from API response
          stateArr.forEach((state: any) => {
            const country = selectedCountries.find((c) => c.countryId === state.countryId);
            if (!country || !country.countryId) return;

            const countryName = country.name;
            if (!newSelectedStates[countryName]) {
              newSelectedStates[countryName] = [];
            }
            newSelectedStates[countryName].push(state.name);
          });

          setSelectedStates((prev) => ({ ...prev, ...newSelectedStates }));

          // Fetch all states for each selected country
          for (const country of selectedCountries) {
            if (country.countryId && !statesByCountry[country.countryId]) {
              await fetchStatesForCountry(country.countryId);
            }
          }
        }
      } catch (error) {
        console.error("FetchStatesForStep3 Error:", error);
        toast({
          title: "Error",
          description: "Failed to fetch states for Step 3",
          variant: "destructive",
        });
      } finally {
        setLoadingStates(false);
      }
    };

    fetchStatesForStep3();
  }
}, [step, projectId, selectedCountries, statesByCountry]);
  // Filter countries based on search term
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearchInput.toLowerCase())
  );

  // Calculate pagination for countries
  const indexOfLastCountry = currentCountryPage * countriesPerPage;
  const indexOfFirstCountry = indexOfLastCountry - countriesPerPage;
  const currentCountries = filteredCountries.slice(indexOfFirstCountry, indexOfLastCountry);
  const totalCountryPages = Math.ceil(filteredCountries.length / countriesPerPage);

  const handleNextStep = async () => {
    if (step === 1) {
      const admin = JSON.parse(localStorage.getItem("adminProfile") || "{}");
      const payload = {
        userId: admin._id,
        serviceType,
        projectName,
        wantImages: wantImages ? 1 : 0
      };

      console.log("Project payload: ", payload);
      setLoading(1);

      if (projectId && lastSubKey) {
        const last = JSON.parse(localStorage.getItem(lastSubKey) || "{}");
        if (
          last.serviceType === serviceType &&
          last.projectName === projectName &&
          last.wantImages === wantImages
        ) {
          setLoading(0);
          setStep(step + 1);
        }
      }

      try {
        const token = localStorage.getItem("token");
        const res = await httpFile.post("/createProject", payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          toast({
            title: "Error",
            description: "invalid token",
            variant: "destructive"
          });
          localStorage.removeItem("token");
          navigate("/login");
        }
        if (res.status === 201) {
          const newId = res.data.data._id;

          toast({
            title: "Success",
            description: "Project created successfully!",
            variant: "destructive"
          });

          localStorage.setItem("lastCreateProjectId", newId);
          setProjectId(newId);
          localStorage.setItem(
            `createProjectLastSubmitted:${newId}`,
            JSON.stringify({ serviceType, projectName, wantImages })
          );
          localStorage.setItem(
            `createProjectDraft:${newId}`,
            JSON.stringify({ serviceType, projectName, wantImages, projectId: newId })
          );
          localStorage.removeItem("createProjectDraft:new");
          setLoading(0);

          setStep(step + 1);
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.response?.data?.message || "An error occurred!",
          variant: "destructive"
        });
      } finally {
        setLoading(0);
      }

      if (!projectName || !serviceType) return;
    } else if (step === 2) {
      const token = localStorage.getItem("token");

      // Define the arrays for country objects with and without countryId
      const countriesPayload = selectedCountries.filter(item => item.countryId);
      const manualPayload = selectedCountries.filter(item => !item.countryId);

      try {
        const res = await httpFile.post(
          "/updateCountryInProject",
          { projectId, countries: countriesPayload, manualCountries: manualPayload },
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );

        console.log("UpdateCountryInProject Response:", {
          status: res.status,
          data: res.data,
        });

        // Accept more status codes (e.g., 200, 201, 204)
        if ([200, 201, 204].includes(res.status)) {
          let updatedCountries = selectedCountries; // Fallback to current selectedCountries
          if (res.data?.data && Array.isArray(res.data.data)) {
            updatedCountries = res.data.data.map((item: any) => ({
              countryId: item.id || item._id || item.countryId, // Handle multiple ID fields
              name: item.name,
              status: selectedCountries.find(c => c.name === item.name)?.status || 0,
            }));
          }
          setSelectedCountries(updatedCountries);
          setStep(step + 1);
          toast({
            title: "Success",
            description: "Countries updated successfully!",
          });
        } else {
          throw new Error(`Unexpected status code: ${res.status}`);
        }
      } catch (err: any) {
        console.error("UpdateCountryInProject Error:", err);
        toast({
          title: "Error",
          description: err.response?.data?.message || `Failed to update countries (Status: ${err.response?.status || "Unknown"})`,
          variant: "destructive",
        });
      }
    } else if (step === 3) {
      const token = localStorage.getItem("token");

      // Prepare states payload
      const statesPayload: { countryId: string; stateId?: string; name: string; status: number }[] = [];
      const manualStatesPayload: { countryId: string; name: string; status: number }[] = [];

      Object.entries(selectedStates).forEach(([countryName, stateNames]) => {
        const country = selectedCountries.find((c) => c.name === countryName);
        if (!country || !country.countryId) return; // Skip if country or countryId is missing
        const countryId = country.countryId;
        const countryStates = statesByCountry[countryId] || [];

        stateNames.forEach((stateName) => {
          const state = countryStates.find((s: State) => s.name === stateName);
          if (state) {
            const status = state.status !== undefined ? state.status : 0; // Ensure status is 0 if undefined
            if (state.manual) {
              manualStatesPayload.push({
                countryId,
                name: stateName,
                status,
              });
            } else {
              statesPayload.push({
                countryId,
                stateId: state.id,
                name: stateName,
                status,
              });
            }
          }
        });
      });

      // console.log(statesPayload, manualStatesPayload);return

      try {
        const res = await httpFile.post(
          "/updateStateInProject",
          { projectId, states: statesPayload, manualStates: manualStatesPayload },
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );

        if (res.status === 200 || res.status === 201) {
          toast({
            title: "Success",
            description: "States updated successfully!",
          });
          setStep(step + 1);
        } else {
          throw new Error("Failed to update states");
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.response?.data?.message || "An error occurred while updating states!",
          variant: "destructive",
        });
      }
    } else if (step === 4) {
      const token = localStorage.getItem("token");

      // Prepare cities payload
      const citiesPayload: { stateId: string; cityId?: string; name: string; status: number }[] = [];
      const manualCitiesPayload: { stateId: string; name: string; status: number }[] = [];

      Object.entries(selectedCities).forEach(([stateName, cityNames]) => {
        const country = selectedCountries.find((c) => selectedStates[c.name]?.includes(stateName));
        if (!country || !country.countryId) return;
        const state = statesByCountry[country.countryId]?.find((s: State) => s.name === stateName);
        if (!state || !state.id) return;
        const stateId = state.id;
        const stateCities = citiesByState[stateName] || [];

        cityNames.forEach((cityName) => {
          const city = stateCities.find((c: City) => c.name === cityName);
          if (city) {
            const status = city.status !== undefined ? city.status : 0;
            if (city.manual) {
              manualCitiesPayload.push({
                stateId,
                name: cityName,
                status,
              });
            } else {
              citiesPayload.push({
                stateId,
                cityId: city.id,
                name: cityName,
                status,
              });
            }
          }
        });
      });

      try {
        const res = await httpFile.post(
          "/updateCityInProject",
          { projectId, cities: citiesPayload, manualCities: manualCitiesPayload },
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );

        console.log("UpdateCityInProject Response:", {
          status: res.status,
          data: res.data,
        });

        if ([200, 201, 204].includes(res.status)) {
          toast({
            title: "Success",
            description: "Cities updated successfully!",
          });
          setStep(step + 1);
        } else {
          throw new Error(`Unexpected status code: ${res.status}`);
        }
      } catch (err: any) {
        console.error("UpdateCityInProject Error:", err);
        toast({
          title: "Error",
          description: err.response?.data?.message || "An error occurred while updating cities!",
          variant: "destructive",
        });
      }

    } else if (step === 5) {
      const formattedData = Object.entries(localAreas).flatMap(([cityName, areas]) => {
        const stateName = Object.keys(selectedCities).find((state) =>
          selectedCities[state].includes(cityName)
        );
        const country = selectedCountries.find((c) => selectedStates[c.name]?.includes(stateName));
        const state = country
          ? statesByCountry[country.countryId]?.find((s: State) => s.name === stateName)
          : null;
        const city = state ? citiesByState[stateName]?.find((c: City) => c.name === cityName) : null;
        const cityId = city?.id || null;

        return areas.map((area: { id: string; name: string }) => ({
          name: area.name,
          cityId,
        }));
      });

      if (formattedData.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one local area or click Skip to proceed.",
          variant: "destructive",
        });
        return;
      }

      setSubmitting(true);
      try {
        const token = localStorage.getItem("token");
        const res = await httpFile.post(
          "/updateLocalAreaInProject",
          { projectId, localAreas: formattedData },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("UpdateLocalAreaInProject Response:", {
          status: res.status,
          data: res.data,
        });

        if ([200, 201, 204].includes(res.status)) {
          toast({
            title: "Success",
            description: "Local areas updated successfully!",
          });
          setStep(step + 1);
          resetForm(); // Reset states
        } else {
          throw new Error(`Unexpected status code: ${res.status}`);
        }
      } catch (error: any) {
        console.error("UpdateLocalAreaInProject Error:", error);
        toast({
          title: "Error",
          description: error.response?.data?.message || "An error occurred while updating local areas!",
          variant: "destructive",
        });
        setStep(step + 1);
        resetForm(); // Reset states even on error
      } finally {
        setSubmitting(false);
      }
    } else if (step === 6) {
      // 1) Ask admin which mode
      const mode = await Swal.fire({
        title: "How do you want to add services?",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "📋 Manual Entry",
        denyButtonText: "🤖 AI Services",
        cancelButtonText: "❌ Cancel"
      });

      if (mode.isDismissed) {
        return; // clicked Cancel or outside
      }

      // 2a) AI branch
      if (mode.isDenied) {
        setSubmitting(true);
        try {
          const token = localStorage.getItem("token");
          const payload = { projectId, wantAiServices: 1 };
          const res = await httpFile.post(
            "/addServicesToLocation",
            payload,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
            }
          );
          if (res.status === 200) {
            toast({
              title: "Success",
              description: "AI services added successfully!",
            });
            setStep(step + 1);
          } else {
            toast({
              title: "Error",
              description: "Failed to add AI services",
              variant: "destructive",
            });
          }
        } catch (error) {
          toast({
            title: "Error",
            description: error.response?.data?.message || "An error occurred while adding AI services!",
            variant: "destructive",
          });
        } finally {
          setSubmitting(false);
        }
        return;
      }

      // 2b) Manual branch
      const manual = await Swal.fire({
        title: "Enter service names or upload Excel",
        html: `
      <textarea id="swal-textarea" class="swal2-textarea"
        placeholder="One service name per line"></textarea>
      <input type="file" id="swal-file" class="swal2-file"
        accept=".xlsx,.xls" />
    `,
        focusConfirm: false,
        preConfirm: () => {
          const text = document.getElementById("swal-textarea").value
            .split("\n")
            .map(l => l.trim())
            .filter(Boolean);

          const fileInput = document.getElementById("swal-file");
          const file = fileInput.files[0];
          // Require at least one source
          if (!text.length && !file) {
            Swal.showValidationMessage(
              "Please enter at least one name or upload an Excel file."
            );
          }
          // If there's a file, parse it and merge
          if (file) {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = e => {
                try {
                  const data = new Uint8Array(e.target.result);
                  const wb = XLSX.read(data, { type: "array" });
                  const sheet = wb.Sheets[wb.SheetNames[0]];
                  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                  const fromFile = rows
                    .map(r => r[0])
                    .filter(v => typeof v === "string" && v.trim());
                  resolve([...text, ...fromFile]);
                } catch (err) {
                  reject("Failed to parse Excel file.");
                }
              };
              reader.onerror = () => reject("Failed to read file.");
              reader.readAsArrayBuffer(file);
            });
          }
          return text;
        }
      });

      if (manual.isConfirmed) {
        const servicesArray = manual.value;
        if (Array.isArray(servicesArray) && servicesArray.length) {
          setSubmitting(true);
          try {
            const token = localStorage.getItem("token");
            const payload = { projectId, wantAiServices: 0, services: servicesArray };
            const res = await httpFile.post(
              "/addServicesToLocation",
              payload,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                }
              }
            );
            if (res.status === 200) {
              toast({
                title: "Success",
                description: "Manual services added successfully!",
              });
              setStep(step + 1);
            } else {
              toast({
                title: "Error",
                description: "Failed to add manual services",
                variant: "destructive",
              });
            }
          } catch (error) {
            toast({
              title: "Error",
              description: error.response?.data?.message || "An error occurred while adding manual services!",
              variant: "destructive",
            });
          } finally {
            setSubmitting(false);
          }
        } else {
          toast({
            title: "Error",
            description: "No services to submit.",
            variant: "destructive",
          });
        }
      }
    } else if (step === 7) {
      // Service entry step
      if (serviceOption === "manual" && !serviceNames.trim()) {
        toast({
          title: "Error",
          description: "Please enter at least one service name",
          variant: "destructive"
        });
        return;
      }
      setStep(step + 1);
    } else if (step === 8) {
      // About Us step
      if (!aboutUsEmail || !aboutUsPhone || !aboutUsLocation) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      setSubmitting(true);
      try {
        const admin = JSON.parse(localStorage.getItem("adminProfile") || "{}");
        const userId = admin._id;
        const payload = { userId, projectId, email: aboutUsEmail, phone: aboutUsPhone, mainLocation: aboutUsLocation };
        const token = localStorage.getItem("token");
        const res = await httpFile.put(
          "/updateAboutUs",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if ([200, 201, 204].includes(res.status)) {
          // Clear local storage except for whitelist
          const whitelist = ["adminProfile", "Role", "token"];
          Object.keys(localStorage).forEach(key => {
            if (!whitelist.includes(key)) localStorage.removeItem(key);
          });

          toast({
            title: "Success",
            description: "About Us information saved successfully!",
          });
          setShowFinalSuccess(true);
        } else {
          throw new Error("Failed to save About Us information");
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.response?.data?.message || "An error occurred while saving About Us information!",
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    }
  };



  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {

    setStep(6);
  };

  const handleCountrySearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && countrySearchInput.trim() !== '') {
      const trimmedInput = countrySearchInput.trim();

      // Check for exact match (case-insensitive)
      const exactMatch = countries.find(country =>
        country.name.toLowerCase() === trimmedInput.toLowerCase()
      );

      if (exactMatch) {
        // Select existing country
        if (!selectedCountries.some(c => c.name === exactMatch.name)) {
          setSelectedCountries([...selectedCountries, { ...exactMatch, status: 0 }]);
        }
      } else {
        // Add new manual country
        const newCountry: Country = { name: trimmedInput, status: 0 };
        setCountries([...countries, newCountry]);
        setSelectedCountries([...selectedCountries, newCountry]);
      }

      setCountrySearchInput('');
      setCurrentCountryPage(1); // Reset to first page
    }
  };


  const toggleState = (countryName: string, stateName: string) => {
    setSelectedStates((prev) => ({
      ...prev,
      [countryName]: prev[countryName]?.includes(stateName)
        ? prev[countryName].filter((s) => s !== stateName)
        : [...(prev[countryName] || []), stateName],
    }));
  };

  const selectAllStates = (countryName: string) => {
    const updatedSelectedStates = { ...selectedStates };
    updatedSelectedStates[countryName] = [...(states[countryName] || [])];
    setSelectedStates(updatedSelectedStates);
  };

  const deselectAllStates = (countryName: string) => {
    const updatedSelectedStates = { ...selectedStates };
    updatedSelectedStates[countryName] = [];
    setSelectedStates(updatedSelectedStates);
  };

  const removeState = (countryName: string, state: string) => {
    const updatedStates = { ...states };
    updatedStates[countryName] = updatedStates[countryName].filter(s => s !== state);
    setStates(updatedStates);
    const updatedSelectedStates = { ...selectedStates };
    updatedSelectedStates[countryName] = updatedSelectedStates[countryName].filter(s => s !== state);
    setSelectedStates(updatedSelectedStates);
  };

  const handleCityKeyDown = (stateName: string, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && cityInput[stateName]?.trim() !== "") {
      e.preventDefault();
      const newCityName = cityInput[stateName].trim();
      const country = selectedCountries.find((c) => selectedStates[c.name]?.includes(stateName));
      if (!country || !country.countryId) return; // Safety check
      const state = statesByCountry[country.countryId]?.find((s: State) => s.name === stateName);
      if (!state || !state.id) {
        toast({
          title: "Error",
          description: "State ID is missing. Please ensure states are saved correctly.",
          variant: "destructive",
        });
        return;
      }
      const stateId = state.id;

      // Check for existing city (case-insensitive)
      const existingCity = citiesByState[stateName]?.find(
        (c: City) => c.name.toLowerCase() === newCityName.toLowerCase()
      );
      if (existingCity) {
        // Select existing city if not already selected
        if (!selectedCities[stateName]?.includes(existingCity.name)) {
          setSelectedCities((prev) => ({
            ...prev,
            [stateName]: [...(prev[stateName] || []), existingCity.name],
          }));
        }
      } else {
        // Add manual city
        const newCity: City = { name: newCityName, state_id: stateId, manual: true, status: 0 };
        setCitiesByState((prev) => ({
          ...prev,
          [stateName]: [...(prev[stateName] || []), newCity],
        }));
        // Only add to selectedCities if it doesn't already exist
        setSelectedCities((prev) => {
          const currentCities = prev[stateName] || [];
          if (currentCities.includes(newCityName)) return prev; // Prevent duplicate
          return {
            ...prev,
            [stateName]: [...currentCities, newCityName],
          };
        });
      }

      // Initialize local area input for this city
      setLocalAreaInput({ ...localAreaInput, [newCityName]: "" });
      setLocalAreas({ ...localAreas, [newCityName]: [] });
      setCityInput({ ...cityInput, [stateName]: "" });
    }
  };

  const handleLocalAreaKeyDown = (city: string, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && localAreaInput[city]?.trim() !== "") {
      e.preventDefault();
      const newLocalAreaName = localAreaInput[city].trim();
      const updatedLocalAreas = { ...localAreas };
      if (!updatedLocalAreas[city]) {
        updatedLocalAreas[city] = [];
      }
      const exists = updatedLocalAreas[city].some(
        (area: { id: string; name: string }) => area.name.toLowerCase() === newLocalAreaName.toLowerCase()
      );
      if (!exists) {
        updatedLocalAreas[city] = [
          ...updatedLocalAreas[city],
          { id: Date.now().toString(), name: newLocalAreaName },
        ];
      } else {
        toast({
          title: "Warning",
          description: "This local area already exists.",
          variant: "destructive",
        });
      }
      setLocalAreas(updatedLocalAreas);
      setLocalAreaInput({ ...localAreaInput, [city]: "" });
    }
  };

  const selectCountryFromList = (countryName: string) => {
    const country = countries.find(c => c.name === countryName);
    if (country && !selectedCountries.some(c => c.name === country.name)) {
      setSelectedCountries([...selectedCountries, { ...country, status: 0 }]);
    }
  };

  const toggleCountryPageCreation = (countryName: string) => {
    setSelectedCountries(selectedCountries.map(country =>
      country.name === countryName
        ? { ...country, status: country.status === 1 ? 0 : 1 }
        : country
    ));
  };



  const toggleCity = (stateName: string, cityName: string) => {
    setSelectedCities((prev) => ({
      ...prev,
      [stateName]: prev[stateName]?.includes(cityName)
        ? prev[stateName].filter((c) => c !== cityName)
        : [...(prev[stateName] || []), cityName],
    }));
  };

  const selectAllCountries = () => {
    const newSelected = filteredCountries.map(country => ({ ...country, status: 0 }));
    setSelectedCountries(newSelected);
  };

  const deselectAllCountries = () => {
    setSelectedCountries([]);
  };


  const selectAllCities = (stateName: string) => {
    setSelectedCities((prev) => ({
      ...prev,
      [stateName]: (citiesByState[stateName] || []).map((city: City) => city.name),
    }));
  };

  const deselectAllCities = (stateName: string) => {
    setSelectedCities((prev) => ({
      ...prev,
      [stateName]: [],
    }));
  };

  const removeLocalArea = (city: string, areaId: string) => {
    const updatedLocalAreas = { ...localAreas };
    updatedLocalAreas[city] = updatedLocalAreas[city].filter((a: { id: string; name: string }) => a.id !== areaId);
    setLocalAreas(updatedLocalAreas);
  };

  const removeCountry = (countryName: string) => {
    const country = selectedCountries.find(c => c.name === countryName);
    setSelectedCountries(selectedCountries.filter(c => c.name !== countryName));
    if (!country?.countryId) {
      // Remove manual country from countries list
      setCountries(countries.filter(c => c.name !== countryName));
    }
  };



  const removeCity = (stateName: string, cityName: string) => {
    setCitiesByState((prev) => ({
      ...prev,
      [stateName]: prev[stateName].filter((c: City) => !(c.name === cityName && c.manual)),
    }));
    setSelectedCities((prev) => ({
      ...prev,
      [stateName]: prev[stateName]?.filter((c) => c !== cityName) || [],
    }));
  };

  const handleCompletedFirstStep = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setStep(2);
    }, 1500);
  };



  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      // In a real app, you would process the file here
      // For demo purposes, we'll just show a success message
      toast({
        title: "File Uploaded",
        description: `${file.name} was successfully uploaded`,
      });
    }
  };

  const resetForm = () => {
    setSelectedCountries([]);
    setCountrySearchInput("");
    setCurrentCountryPage(1);
    setSelectedStates({});
    setStateInput({});
    setCitiesByState({});
    setSelectedCities({});
    setCityInput({});
    setLocalAreas({});
    setLocalAreaInput({});
    setServiceOption("");
    setServiceNames("");
    setAboutUsEmail("");
    setAboutUsPhone("");
    setAboutUsLocation("");
  };
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Input
                id="serviceType"
                placeholder="Enter service type"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wantImages"
                checked={wantImages}
                onCheckedChange={(checked) => setWantImages(checked === true)}
              />
              <label
                htmlFor="wantImages"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Do you want images?
              </label>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Choose Countries</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Search or Add Country</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search existing countries or type new country name and press Enter"
                    value={countrySearchInput}
                    onChange={(e) => {
                      setCountrySearchInput(e.target.value);
                      setCurrentCountryPage(1);
                    }}
                    onKeyDown={handleCountrySearchKeyDown}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Type to search existing countries or enter a new country name and press Enter to add it
                </p>
              </div>

              <div className="flex space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllCountries}>
                  Select All ({filteredCountries.length})
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={deselectAllCountries}>
                  Deselect All
                </Button>
              </div>

              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {currentCountries.map((country) => (
                    <div
                      key={country.countryId || country.name} // Unique key for country
                      className="border p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => selectCountryFromList(country.name)}
                          className="flex-1 text-left text-sm font-medium cursor-pointer hover:text-blue-600"
                          disabled={selectedCountries.some((c) => c.name === country.name)}
                        >
                          {country.name}
                          {selectedCountries.some((c) => c.name === country.name) && (
                            <span className="ml-2 text-green-600">✓ Selected</span>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalCountryPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentCountryPage(Math.max(1, currentCountryPage - 1))}
                      disabled={currentCountryPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentCountryPage} of {totalCountryPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentCountryPage(Math.min(totalCountryPages, currentCountryPage + 1))}
                      disabled={currentCountryPage === totalCountryPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Selected Countries ({selectedCountries.length})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedCountries.map((country) => (
                    <div
                      key={country.countryId || country.name} // Unique key for country
                      className="flex items-center justify-between p-3 bg-white rounded border"
                    >
                      <span className="font-medium">{country.name}</span>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`page-${country.name}`}
                            checked={country.status === 1}
                            onCheckedChange={() => toggleCountryPageCreation(country.name)}
                          />
                          <label
                            htmlFor={`page-${country.name}`}
                            className="text-xs text-blue-600 cursor-pointer"
                          >
                            Create page
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCountry(country.name)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {selectedCountries.length === 0 && (
                    <div className="text-center p-4 text-gray-500 text-sm">
                      No countries selected yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Choose States</h3>
            <div className="space-y-6">
              {selectedCountries.map((country) => {
                if (!country.countryId) return null; // Skip countries without countryId
                const countryId = country.countryId;
                // Filter states based on search input
                const filteredStates = (statesByCountry[countryId] || []).filter((state: State) =>
                  state.name.toLowerCase().includes((stateInput[country.name] || "").toLowerCase())
                );
                return (
                  <div
                    key={countryId}
                    className="border p-4 rounded-md"
                  >
                    <h4 className="font-medium mb-2">{country.name}</h4>

                    <div className="space-y-2">
                      <Label>Search or Add State</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder={`Search or add state for ${country.name}`}
                          value={stateInput[country.name] || ""}
                          onChange={(e) => setStateInput({ ...stateInput, [country.name]: e.target.value })}
                          onKeyDown={(e) => handleStateKeyDown(country.name, e)}
                          onClick={() => handleCountryClick(countryId)}
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Type to search existing states or enter a new state name and press Enter to add it
                      </p>
                    </div>

                    {loadingStates && <div className="text-sm text-gray-500">Loading states...</div>}

                    {filteredStates.length > 0 ? (
                      <div className="border rounded-lg p-4 max-h-96 overflow-y-auto mt-4">
                        <div className="flex space-x-2 mb-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => selectAllStates(country.name)}
                          >
                            Select All
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => deselectAllStates(country.name)}
                          >
                            Deselect All
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {filteredStates.map((state: State) => (
                            <div
                              key={state.id || state.name}
                              className="flex items-center justify-between"
                            >
                              <button
                                type="button"
                                onClick={() => toggleState(country.name, state.name)}
                                className="flex-1 text-left text-sm font-medium cursor-pointer hover:text-blue-600"
                              >
                                {state.name}
                                {selectedStates[country.name]?.includes(state.name) && (
                                  <span className="ml-2 text-green-600">✓ Selected</span>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : stateInput[country.name]?.trim() ? (
                      <div className="text-sm text-gray-500 mt-2">No matching states found</div>
                    ) : (
                      <div className="text-sm text-gray-500 mt-2">No states available</div>
                    )}

                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Selected States ({selectedStates[country.name]?.length || 0})</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">

                        {filteredStates.length > 0 ? (
                          <div className="border rounded-lg p-4 max-h-96 overflow-y-auto mt-4">
                            <div className="flex space-x-2 mb-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => selectAllStates(country.name)}
                              >
                                Select All
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => deselectAllStates(country.name)}
                              >
                                Deselect All
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {filteredStates.map((state: State) => (
                                <div key={state.id || state.name} className="flex items-center justify-between p-3 bg-white rounded border">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`select-${country.name}-${state.name}`}
                                      checked={selectedStates[country.name]?.includes(state.name)}
                                      onCheckedChange={() => toggleState(country.name, state.name)}
                                    />
                                    <label
                                      htmlFor={`select-${country.name}-${state.name}`}
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      {state.name}
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`page-${country.name}-${state.name}`}
                                        checked={state.status === 1}
                                        onCheckedChange={() => toggleStatePageCreation(country.name, state.name)}
                                      />
                                      <label
                                        htmlFor={`page-${country.name}-${state.name}`}
                                        className="text-xs text-blue-600 cursor-pointer"
                                      >
                                        Create page
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : stateInput[country.name]?.trim() ? (
                          <div className="text-sm text-gray-500 mt-2">No matching states found</div>
                        ) : (
                          <div className="text-sm text-gray-500 mt-2">No states available</div>
                        )}

                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Selected States ({selectedStates[country.name]?.length || 0})</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {selectedStates[country.name]?.length > 0 ? (
                              selectedStates[country.name].map((stateName) => (
                                <div key={stateName} className="flex items-center justify-between p-3 bg-white rounded border">
                                  <span className="font-medium">{stateName}</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleState(country.name, stateName)}
                                    className="text-gray-500 hover:text-red-500"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="text-center p-4 text-gray-500 text-sm">No states selected</div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
              {selectedCountries.length === 0 && (
                <div className="text-center p-6 border border-dashed rounded-md">
                  <p className="text-gray-500">No countries selected. Please go back and select countries first.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Choose Cities</h3>
            <div className="space-y-6">
              {Object.entries(selectedStates).flatMap(([country, statesList]) =>
                statesList.map((state) => {
                  const countryObj = selectedCountries.find((c) => c.name === country);
                  if (!countryObj || !countryObj.countryId) return null;
                  const stateObj = statesByCountry[countryObj.countryId]?.find((s: State) => s.name === state);
                  if (!stateObj || !stateObj.id) return null;
                  const stateId = stateObj.id;
                  const filteredCities = (citiesByState[state] || []).filter((city: City) =>
                    city.name.toLowerCase().includes((cityInput[state] || "").toLowerCase())
                  );
                  return (
                    <div key={state} className="border p-4 rounded-md">
                      <h4 className="font-medium mb-2">{state}</h4>
                      <p className="text-xs text-gray-500 mb-2">({country})</p>

                      <div className="space-y-2">
                        <Label>Search or Add City</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                         



<Input
  placeholder={`Search or add city for ${state}`}
  value={cityInput[state] || ""}
  onChange={(e) => {
    setCityInput({ ...cityInput, [state]: e.target.value });
    if (!citiesByState[state]) {
      fetchCitiesForState(stateId, state, e.target.value);
    }
  }}
  onKeyDown={(e) => handleCityKeyDown(state, e)}
  onFocus={() => {
    if (!citiesByState[state]) {
      fetchCitiesForState(stateId, state, cityInput[state] || "");
    }
  }}
  className="pl-10"
/>






                        </div>
                        <p className="text-xs text-gray-500">
                          Type to search existing cities or enter a new city name and press Enter to add it
                        </p>
                      </div>

                      {loading && <div className="text-sm text-gray-500">Loading cities...</div>}






{filteredCities.length > 0 ? (
  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto mt-4">
    <div className="flex space-x-2 mb-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => selectAllCities(state)}
      >
        Select All
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => deselectAllCities(state)}
      >
        Deselect All
      </Button>
    </div>
    <div className="space-y-2">
      {filteredCities.map((city: City) => (
        <div key={city.id || city.name} className="flex items-center justify-between p-3 bg-white rounded border">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`select-${state}-${city.name}`}
              checked={selectedCities[state]?.includes(city.name)}
              onCheckedChange={() => toggleCity(state, city.name)}
            />
            <label
              htmlFor={`select-${state}-${city.name}`}
              className="text-sm font-medium cursor-pointer"
            >
              {city.name}
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`page-${state}-${city.name}`}
                checked={city.status === 1}
                onCheckedChange={() => toggleCityPageCreation(state, city.name)}
              />
              <label
                htmlFor={`page-${state}-${city.name}`}
                className="text-xs text-blue-600 cursor-pointer"
              >
                Create page
              </label>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
) : cityInput[state]?.trim() ? (
  <div className="text-sm text-gray-500 mt-2">No matching cities found</div>
) : (
  <div className="text-sm text-gray-500 mt-2">No cities available</div>
)}

<div className="mt-4">
  <h4 className="text-sm font-medium mb-2">Selected Cities ({selectedCities[state]?.length || 0})</h4>
  <div className="space-y-2 max-h-64 overflow-y-auto">
    {selectedCities[state]?.length > 0 ? (
      selectedCities[state].map((cityName) => (
        <div key={cityName} className="flex items-center justify-between p-3 bg-white rounded border">
          <span className="font-medium">{cityName}</span>
          <button
            type="button"
            onClick={() => toggleCity(state, cityName)}
            className="text-gray-500 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))
    ) : (
      <div className="text-center p-4 text-gray-500 text-sm">No cities selected</div>
    )}
  </div>
</div>









                  
                    </div>
                  );
                })
              )}
              {Object.values(selectedStates).every((states) => states.length === 0) && (
                <div className="text-center p-6 border border-dashed rounded-md">
                  <p className="text-gray-500">No states selected. Please go back and select states first.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 5:
        if (step !== 5) return null; // Safeguard to ensure Step 5 only renders when step is 5
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Choose Local Areas</h3>
            <div className="space-y-6">
              {loadingLocalAreas ? (
                <div className="text-center p-6">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                  <p className="text-gray-500 mt-2">Loading local areas...</p>
                </div>
              ) : Object.entries(selectedCities).flatMap(([state, citiesList]) =>
                citiesList.map((city) => (
                  <div key={city} className="border p-4 rounded-md">
                    <h4 className="font-medium mb-1">{city}</h4>
                    <p className="text-xs text-gray-500 mb-2">({state})</p>
                    <div className="space-y-2 mb-3">
                      <Label>Add Local Areas (Press Enter to Add):</Label>
                      <Input
                        placeholder={`Type local area for ${city} and press Enter`}
                        value={localAreaInput[city] || ""}
                        onChange={(e) => setLocalAreaInput({ ...localAreaInput, [city]: e.target.value })}
                        onKeyDown={(e) => handleLocalAreaKeyDown(city, e)}
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <h5 className="text-xs font-medium mb-1 text-gray-500">Added Local Areas</h5>
                      <div className="flex flex-wrap gap-1">
                        {localAreas[city]?.map((area: { id: string; name: string }) => (
                          <Badge key={area.id} variant="secondary" className="flex items-center gap-1">
                            <span>{area.name}</span>
                            <button
                              type="button"
                              onClick={() => removeLocalArea(city, area.id)}
                              className="text-xs"
                              disabled={submitting}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                        {(!localAreas[city] || localAreas[city].length === 0) && (
                          <span className="text-xs text-gray-500">No local areas added</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {Object.values(selectedCities).every((cities) => cities.length === 0) && !loadingLocalAreas && (
                <div className="text-center p-6 border border-dashed rounded-md">
                  <p className="text-gray-500">No cities selected. Please go back and select cities first.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Preview</h3>
            <div className="space-y-4 border p-4 rounded-md bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Project Name</h4>
                  <p className="font-medium">{projectName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Service Type</h4>
                  <p className="font-medium">{serviceType}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Want Images</h4>
                  <p className="font-medium">{wantImages ? "Yes" : "No"}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Countries with Page Creation</h4>
                <div className="space-y-2">
                  {selectedCountries.map((country) => (
                    <div
                      key={country.countryId || country.name}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <span className="font-medium">{country.name}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${country.status === 1 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {country.status === 1 ? "Page will be created" : "No page"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Locations</h4>
                <div className="space-y-3">
                  {selectedCountries.map((country) => {
                    const countryId = country.countryId || country.name;
                    return (
                      <div key={countryId} className="border-t pt-2">
                        <h5 className="font-medium">{country.name}</h5>
                        {selectedStates[country.name]?.length > 0 ? (
                          <div className="ml-4 mt-1 space-y-2">
                            {selectedStates[country.name].map((stateName) => {
                              const state = statesByCountry[countryId]?.find((s: State) => s.name === stateName);
                              return (
                                <div key={stateName}>
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">{stateName}</p>
                                    <span
                                      className={`text-xs px-2 py-1 rounded ${state?.status === 1
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600"
                                        }`}
                                    >
                                      {state?.status === 1 ? "Page will be created" : "No page"}
                                    </span>
                                  </div>
                                  {selectedCities[stateName]?.length > 0 ? (
                                    <div className="ml-4">
                                      {selectedCities[stateName].map((city) => (
                                        <div key={city} className="mt-1">
                                          <p className="text-sm">{city}</p>
                                          {localAreas[city]?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 ml-4 mt-1">
                                              {localAreas[city].map((area) => (
                                                <Badge key={area} variant="outline" className="text-xs">
                                                  {area}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-500 ml-4">No cities selected</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 ml-4">No states selected</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      case 7:
        // Manual service entry
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">
              {serviceOption === "manual" ? "Manual Service Entry" : "AI Service Generation"}
            </h3>

            {serviceOption === "manual" ? (
              <>
                <div className="space-y-4">
                  <Label htmlFor="serviceNames">Enter service names or upload Excel</Label>
                  <div className="text-xs text-gray-500 mb-2">One service name per line</div>
                  <Textarea
                    id="serviceNames"
                    placeholder="Enter one service per line"
                    className="min-h-[150px]"
                    value={serviceNames}
                    onChange={(e) => setServiceNames(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fileUpload" className="block">Choose file</Label>
                  <div className="flex items-center">
                    <Input
                      id="fileUpload"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="flex-1"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-10 border-2 border-dashed rounded-lg">
                <Bot className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">AI Service Generation</h3>
                <p className="text-gray-500 mb-4">
                  Our AI will analyze your project details and suggest appropriate services.
                </p>
                <div className="flex justify-center">
                  <Button
                    type="button"
                    onClick={() => {
                      toast({
                        title: "AI Services Generated",
                        description: "10 services have been generated based on your project",
                      });
                      setStep(8);
                    }}
                  >
                    Generate Services
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      case 8:
        // About us details
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Enter About Us Details</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="aboutUsEmail">Email</Label>
                </div>
                <Input
                  id="aboutUsEmail"
                  type="email"
                  placeholder="Enter email"
                  value={aboutUsEmail}
                  onChange={(e) => setAboutUsEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="aboutUsPhone">Phone</Label>
                </div>
                <Input
                  id="aboutUsPhone"
                  placeholder="Enter phone"
                  value={aboutUsPhone}
                  onChange={(e) => setAboutUsPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="aboutUsLocation">Main Location</Label>
                </div>
                <Input
                  id="aboutUsLocation"
                  placeholder="Enter main location"
                  value={aboutUsLocation}
                  onChange={(e) => setAboutUsLocation(e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Project Information";
      case 2: return "Country Selection";
      case 3: return "State Selection";
      case 4: return "City Selection";
      case 5: return "Local Area Selection";
      case 6: return "Preview";
      case 7: return serviceOption === "manual" ? "Manual Service Entry" : "AI Service Generation";
      case 8: return "About Us Details";
      default: return "Project Creation";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Create New Project</h1>
      </div>

      {!showFinalSuccess ? (
        <>
          <div className="flex justify-between mb-6">
            <div className="flex items-center space-x-2">
              {Array.from({ length: 8 }, (_, i) => i + 1).map(i => (
                <div
                  key={i}
                  className={`flex items-center ${i > 1 && "ml-2"}`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${step === i
                        ? "bg-blue-600 text-white"
                        : step > i
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"}`}
                  >
                    {step > i ? <Check className="h-4 w-4" /> : i}
                  </div>
                  {i < 8 && (
                    <div
                      className={`h-1 w-6 ${step > i ? "bg-green-500" : "bg-gray-200"}`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {showSuccess && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-lg font-medium">Project Created Successfully</p>
              </div>
            </div>
          )}



          <Card>
            <CardHeader>
              <CardTitle>{getStepTitle()}</CardTitle>
              <CardDescription>
                {step === 1 && "Enter the basic details for your new project."}
                {step === 2 && "Select the countries where your service will be available."}
                {step === 3 && "Select states or regions for your selected countries."}
                {step === 4 && "Select cities for your selected states."}
                {step === 5 && "Add local areas for your selected cities."}
                {step === 6 && "Review your project details before finalizing."}
                {step === 7 && serviceOption === "manual" && "Enter service names manually or upload a spreadsheet."}
                {step === 7 && serviceOption === "ai" && "Let our AI generate service suggestions for you."}
                {step === 8 && "Enter contact and location information for your business."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderStep()}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackStep}
                disabled={step === 1 || submitting}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              <div className="flex space-x-2">
                {step === 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkip}
                    disabled={submitting}
                  >
                    Skip
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={loading === 1 || submitting}
                >
                  {step < 8 ? (
                    <>
                      {submitting ? "Submitting..." : "Next"}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    "Add Details"
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </>
      ) : (
        <Card className="border-green-500">
          <CardHeader className="bg-green-50 border-b border-green-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-green-700">Success</CardTitle>
                <CardDescription className="text-green-600">
                  Your About Us information has been saved!
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <p className="text-lg">
                Your project has been successfully created and is ready to use.
              </p>

              <div className="text-sm text-gray-500">
                Redirecting in <span className="font-bold">{redirectCounter}</span> seconds…
              </div>

              <Button onClick={() => navigate("/admin/Project_listing")}>
                Go to project listing page
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
