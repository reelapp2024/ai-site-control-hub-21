import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Edit3, Save, Eye, CheckCircle, CheckSquare, Square } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export function UpdateProject() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mock data - replace with actual API call based on projectId
  const [projectData, setProjectData] = useState({
    projectName: "House Cleaning Service",
    welcomeLine: "Welcome to our professional house cleaning service",
    callToAction: "Book your cleaning today!",
    serviceType: "House",
    primaryColor: "#7c3aed",
    secondaryColor: "#a855f7",
    description: "Professional house cleaning services for your home",
    selectedCountries: [{ name: "United States", id: "US" }],
    selectedStates: [{ name: "California", id: "CA" }],
    selectedCities: [{ name: "Los Angeles", id: "LA" }],
    selectedLocalAreas: [{ name: "Downtown", id: "DT" }, { name: "Hollywood", id: "HW" }],
    isCountry: false,
    isState: false,
    isCity: false,
    isLocal: true
  });

  // Mock data for available options
  const [availableCountries] = useState([
    { name: "United States", id: "US" },
    { name: "Canada", id: "CA" },
    { name: "United Kingdom", id: "UK" },
    { name: "Australia", id: "AU" }
  ]);

  const [availableStates] = useState([
    { name: "California", id: "CA" },
    { name: "New York", id: "NY" },
    { name: "Texas", id: "TX" },
    { name: "Florida", id: "FL" }
  ]);

  const [availableCities] = useState([
    { name: "Los Angeles", id: "LA" },
    { name: "San Francisco", id: "SF" },
    { name: "New York City", id: "NYC" },
    { name: "Miami", id: "MIA" }
  ]);

  const [availableLocalAreas] = useState([
    { name: "Downtown", id: "DT" },
    { name: "Hollywood", id: "HW" },
    { name: "Beverly Hills", id: "BH" },
    { name: "Santa Monica", id: "SM" }
  ]);

  const steps = [
    { title: "Project Information", icon: "info" },
    { title: "Country Selection", icon: "globe" },
    { title: "State Selection", icon: "map" },
    { title: "City Selection", icon: "building" },
    { title: "Local Area Selection", icon: "map-pin" },
    { title: "Preview", icon: "eye" }
  ];

  const handleInputChange = (field: string, value: any) => {
    setProjectData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    // API call would go here
    console.log("Saving project:", projectData);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Success",
        description: "Project updated successfully!",
      });
      navigate("/admin/project-list");
    }, 1000);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      toast({
        title: "Progress Saved",
        description: `Moving to ${steps[currentStep + 1].title}`,
      });
    }
  };

  const handleSelectAll = (type: 'countries' | 'states' | 'cities' | 'localAreas') => {
    const typeMap = {
      countries: { available: availableCountries, selected: 'selectedCountries' },
      states: { available: availableStates, selected: 'selectedStates' },
      cities: { available: availableCities, selected: 'selectedCities' },
      localAreas: { available: availableLocalAreas, selected: 'selectedLocalAreas' }
    };

    const { available, selected } = typeMap[type];
    handleInputChange(selected, available);
    toast({
      title: "Selection Updated",
      description: `All ${type} selected`,
    });
  };

  const handleDeselectAll = (type: 'countries' | 'states' | 'cities' | 'localAreas') => {
    const typeMap = {
      countries: 'selectedCountries',
      states: 'selectedStates',
      cities: 'selectedCities',
      localAreas: 'selectedLocalAreas'
    };

    handleInputChange(typeMap[type], []);
    toast({
      title: "Selection Updated",
      description: `All ${type} deselected`,
    });
  };

  const renderLocationSelectionStep = (
    title: string,
    isEnabledField: string,
    selectedField: string,
    availableOptions: any[],
    type: 'countries' | 'states' | 'cities' | 'localAreas'
  ) => {
    const selectedItems = projectData[selectedField];
    const allSelected = selectedItems.length === availableOptions.length;

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Checkbox
            id={isEnabledField}
            checked={projectData[isEnabledField]}
            onCheckedChange={(checked) => handleInputChange(isEnabledField, checked)}
          />
          <Label htmlFor={isEnabledField}>{title}</Label>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Selected {title.split(' ')[1]}s</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(type)}
                disabled={allSelected}
                className="flex items-center gap-2"
              >
                <CheckSquare className="h-3 w-3" />
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDeselectAll(type)}
                disabled={selectedItems.length === 0}
                className="flex items-center gap-2"
              >
                <Square className="h-3 w-3" />
                Deselect All
              </Button>
            </div>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-lg bg-gray-50">
            {selectedItems.length > 0 ? (
              selectedItems.map((item) => (
                <Badge key={item.id} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                  {item.name}
                  <button
                    onClick={() => {
                      const updated = selectedItems.filter(i => i.id !== item.id);
                      handleInputChange(selectedField, updated);
                    }}
                    className="ml-1 text-red-500 hover:text-red-700 font-bold"
                  >
                    ×
                  </button>
                </Badge>
              ))
            ) : (
              <p className="text-sm text-gray-500">No {title.split(' ')[1].toLowerCase()}s selected</p>
            )}
          </div>
          
          <div className="mt-4">
            <Label className="text-sm font-medium">Available Options</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {availableOptions.map((option) => {
                const isSelected = selectedItems.some(item => item.id === option.id);
                return (
                  <Button
                    key={option.id}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (isSelected) {
                        const updated = selectedItems.filter(item => item.id !== option.id);
                        handleInputChange(selectedField, updated);
                      } else {
                        handleInputChange(selectedField, [...selectedItems, option]);
                      }
                    }}
                    className="justify-start"
                  >
                    {option.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Project Information
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                value={projectData.projectName}
                onChange={(e) => handleInputChange("projectName", e.target.value)}
                placeholder="Enter project name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="welcomeLine">Welcome Line *</Label>
              <Input
                id="welcomeLine"
                value={projectData.welcomeLine}
                onChange={(e) => handleInputChange("welcomeLine", e.target.value)}
                placeholder="Enter welcome message"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="callToAction">Call to Action *</Label>
              <Input
                id="callToAction"
                value={projectData.callToAction}
                onChange={(e) => handleInputChange("callToAction", e.target.value)}
                placeholder="Enter call to action"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="serviceType">Service Type *</Label>
              <Input
                id="serviceType"
                value={projectData.serviceType}
                onChange={(e) => handleInputChange("serviceType", e.target.value)}
                placeholder="Enter service type"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={projectData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter project description"
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={projectData.primaryColor}
                    onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={projectData.primaryColor}
                    onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                    placeholder="#7c3aed"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={projectData.secondaryColor}
                    onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={projectData.secondaryColor}
                    onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                    placeholder="#a855f7"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 1: // Country Selection
        return renderLocationSelectionStep(
          "Enable Country Level Service",
          "isCountry",
          "selectedCountries",
          availableCountries,
          "countries"
        );

      case 2: // State Selection
        return renderLocationSelectionStep(
          "Enable State Level Service",
          "isState",
          "selectedStates",
          availableStates,
          "states"
        );

      case 3: // City Selection
        return renderLocationSelectionStep(
          "Enable City Level Service",
          "isCity",
          "selectedCities",
          availableCities,
          "cities"
        );

      case 4: // Local Area Selection
        return renderLocationSelectionStep(
          "Enable Local Area Service",
          "isLocal",
          "selectedLocalAreas",
          availableLocalAreas,
          "localAreas"
        );

      case 5: // Preview
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Eye className="mr-2 text-purple-600" />
                Project Preview
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Project Name</Label>
                  <p className="text-sm">{projectData.projectName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Service Type</Label>
                  <p className="text-sm">{projectData.serviceType}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-600">Welcome Line</Label>
                  <p className="text-sm">{projectData.welcomeLine}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-600">Call to Action</Label>
                  <p className="text-sm">{projectData.callToAction}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-600">Description</Label>
                  <p className="text-sm">{projectData.description}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: projectData.primaryColor }}
                    />
                    <span className="text-sm">{projectData.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: projectData.secondaryColor }}
                    />
                    <span className="text-sm">{projectData.secondaryColor}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Service Levels</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {projectData.isCountry && <Badge variant="outline">Country</Badge>}
                    {projectData.isState && <Badge variant="outline">State</Badge>}
                    {projectData.isCity && <Badge variant="outline">City</Badge>}
                    {projectData.isLocal && <Badge variant="outline">Local</Badge>}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Total Locations</Label>
                  <p className="text-sm">
                    {projectData.selectedCountries.length + 
                     projectData.selectedStates.length + 
                     projectData.selectedCities.length + 
                     projectData.selectedLocalAreas.length} locations
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950 dark:to-gray-900 flex font-poppins">
      <AdminSidebar
        activeSection="project-list"
        setActiveSection={() => {}}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-800/20 min-h-[calc(100vh-4rem)]">
            <div className="p-8">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/admin/project-list")}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Projects
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-purple-900">Update Project</h1>
                    <p className="text-sm text-purple-600">Edit your project settings and configuration</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Progress</h3>
                      <span className="text-sm text-gray-600">
                        Step {currentStep + 1} of {steps.length}
                      </span>
                    </div>
                    <Progress value={(currentStep + 1) / steps.length * 100} className="mb-4" />
                    
                    {/* Step Navigation */}
                    <div className="flex flex-wrap gap-2">
                      {steps.map((step, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentStep(index)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            index === currentStep
                              ? "bg-purple-600 text-white"
                              : index < currentStep
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {step.title}
                          {index < currentStep && <CheckCircle className="h-3 w-3" />}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Step Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      {steps[currentStep].title}
                      <Edit3 className="h-4 w-4 text-gray-400" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {renderStepContent()}
                  </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex gap-3">
                    {currentStep === steps.length - 1 ? (
                      <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                      >
                        Next
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
