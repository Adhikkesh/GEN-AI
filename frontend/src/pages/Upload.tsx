import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon } from "lucide-react";

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [githubLink, setGithubLink] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "Error",
        description: "Please upload your resume",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Success",
      description: "Resume uploaded successfully",
    });
    
    navigate("/dashboard");
  };

  const handleTakeQuiz = () => {
    toast({
      title: "Info",
      description: "Quiz feature coming soon",
    });
    navigate("/dashboard");
  };

  return (
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
              placeholder="https://github.com/yourusername"
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
  );
};

export default Upload;
