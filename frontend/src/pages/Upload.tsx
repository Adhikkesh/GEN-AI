import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon, Check, Loader2, Circle } from "lucide-react";

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [githubLink, setGithubLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [careers, setCareers] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const steps = [
    "Analyzing your resume and extracting skills...",
    "Fetching and analyzing your GitHub repositories...",
    "Generating personalized career recommendations...",
  ];

  // Define the shape of recommendation data
  interface Recommendation {
    career: string;
    [key: string]: unknown; // if there are other fields you don’t care about
  }

  const renderStepIcon = (index: number) => {
    if (currentStep > steps.length) {
      return <Check className="h-4 w-4" />;
    }
    if (index < currentStep) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    if (index === currentStep) {
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    }
    return <Circle className="h-4 w-4" />;
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSelectCareer = async (career: string) => {
    const token = localStorage.getItem("idToken");
    if (!token) {
      toast({
        title: "Error",
        description: "Please sign in to continue",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const baseURL = "https://asia-south1-rock-idiom-475618-q4.cloudfunctions.net";

    try {
      const response = await fetch(`${baseURL}/select_career`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ career_title: career }),
      });

      if (!response.ok) {
        throw new Error("Failed to select career");
      }

      toast({
        title: "Success",
        description: `"${career}" selected as your career path!`,
      });

      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to select career. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowCareerModal(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast({
        title: "Error",
        description: "Please upload your resume",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("idToken");
    if (!token) {
      toast({
        title: "Error",
        description: "Please sign in to continue",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const githubUsername = githubLink
      ? githubLink.split("/").pop()?.replace(/\/+$/, "") || null
      : null;

    const baseURL = "https://asia-south1-rock-idiom-475618-q4.cloudfunctions.net";

    setIsLoading(true);
    setCurrentStep(0);

    try {
      // Step 0: Upload resume to get path
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(`${baseURL}/upload_resume`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Upload Error:", errorText);
        throw new Error(`Failed to upload resume: ${errorText}`);
      }

      const uploadData = await uploadResponse.json();
      const resumePath = uploadData.path;
      if (!resumePath) {
        throw new Error("No path returned from upload");
      }

      // Step 0 continued: Handle resume with the path
      const resumeResponse = await fetch(`${baseURL}/handle_resume`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename: resumePath }), // Assuming /handle_resume expects { filename: path }
      });

      if (!resumeResponse.ok) {
        const errorText = await resumeResponse.text();
        console.error("Handle Resume Error:", errorText);
        throw new Error(`Failed to process resume: ${errorText}`);
      }

      const resumeData = await resumeResponse.json();

      await delay(1500);
      const nextStepAfterResume = githubUsername ? 1 : 2;
      setCurrentStep(nextStepAfterResume);

      let allRecommendations: Recommendation[] = resumeData.recommendations || [];

      // Step 1: Handle GitHub if provided
      if (githubUsername) {
        const githubResponse = await fetch(`${baseURL}/handle_github`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ githubUsername }),
        }).then((res) => {
          if (!res.ok) {
            res.text().then(text => console.error("Server Error:", text));
            throw new Error("Failed to process GitHub");
          }
          return res.json();
        });

        allRecommendations = [...allRecommendations, ...(githubResponse.recommendations || [])];
        await delay(1500);
        setCurrentStep(2);
      }

      // Step 2: Generating recommendations
      await delay(2500);

      // Extract unique careers
      const uniqueCareers = [
        ...new Set(
          allRecommendations.map((rec) => rec.career)
        ),
      ];
      setCareers(uniqueCareers);

      setCurrentStep(3);
      await delay(500);

      setShowCareerModal(true);
      setIsLoading(false);

      toast({
        title: "Analysis Complete!",
        description: "Check out your recommended career paths below.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to process your profile. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      setCurrentStep(0);
    }
  };

  const handleTakeQuiz = () => {
    navigate("/quiz");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Analyzing Your Profile</h2>
              <p className="text-muted-foreground">This may take a few moments...</p>
            </div>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`flex-shrink-0 ${
                    index < currentStep
                      ? 'text-green-500'
                      : index === currentStep
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}>
                    {renderStepIcon(index)}
                  </div>
                  <span className={`flex-1 ${
                    index === currentStep ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
            <Progress
              value={(Math.min(currentStep, steps.length) / steps.length) * 100}
              className="w-full"
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8 space-y-6 hover-lift animate-fade-in shadow-xl">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Upload Your Resume</h1>
            <p className="text-muted-foreground">Help us understand your background</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="resume">Resume (PDF)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UploadIcon className="h-4 w-4" />
                    {file.name}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="github">GitHub Link (Optional)</Label>
              <Input
                id="github"
                type="url"
                placeholder="yourusername"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1">
                Upload Resume
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={handleTakeQuiz}>
                Take Quiz Instead
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <Dialog open={showCareerModal} onOpenChange={setShowCareerModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Your Career Path</DialogTitle>
          </DialogHeader>
                    <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Based on your resume and GitHub profile, here are personalized career recommendations:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {careers.map((career) => (
                <Button
                  key={career}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => handleSelectCareer(career)}
                >
                  {career}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Upload;