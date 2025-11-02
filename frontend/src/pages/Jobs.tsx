import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Building2, DollarSign, Search, Filter, Bookmark } from "lucide-react";
import { auth, db } from "../lib/auth"; // Adjust path
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Small delay for persistence restore (edge case)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (currentUser) {
        setUser(currentUser);
        console.log("User authenticated via SDK:", currentUser.email); // Debug
        await fetchJobs(currentUser);
      } else {
        console.log("No user authenticated");
        setUser(null);
        setError("Please log in to view jobs.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchJobs = async (currentUser) => {
    setError(null);
    setLoading(true); // Re-set loading for fetch
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error("User document not found");
      }

      const { careerId } = userDoc.data();
      if (!careerId) {
        throw new Error("No career profile set up");
      }

      const listingsCol = collection(db, "career_jobs", careerId, "listings");
      const snapshot = await getDocs(listingsCol);

      const fetchedJobs = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const postedDate = new Date(data.posted_at);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
        const posted = diffDays === 0 ? "Today" : `${diffDays} days ago`;

        return {
          id: docSnap.id,
          title: data.cleaned_title || data.raw_title,
          company: data.raw_company_name,
          location: data.location_text || data.city || data.state || "",
          type: data.employment_type || "Full-time",
          salary: data.salary_text || "",
          skills: data.skills_list || [],
          posted,
          featured: diffDays <= 2,
          applyLink: data.apply_link,
          description: data.cleaned_description,
        };
      });

      setJobs(fetchedJobs);

      const allCount = fetchedJobs.length;
      const remoteCount = fetchedJobs.filter((j) => j.location.toLowerCase().includes("remote")).length;
      const fullTimeCount = fetchedJobs.filter((j) => j.type.toLowerCase().includes("full-time")).length;
      const contractCount = fetchedJobs.filter((j) => j.type.toLowerCase().includes("contract")).length;

      setFilters([
        { label: "All Jobs", count: allCount },
        { label: "Remote", count: remoteCount },
        { label: "Full-time", count: fullTimeCount },
        { label: "Contract", count: contractCount },
      ]);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-muted-foreground">Loading jobs...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive mb-2">Authentication Required</h2>
        <p className="text-muted-foreground mb-4">{error || "Please log in."}</p>
        <Button onClick={() => window.location.href = '/login'} className="hover-lift">
          Go to Login
        </Button>
      </div>
    );
  }

  if (filteredJobs.length === 0 && jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">No Jobs Found</h2>
        <p className="text-muted-foreground">Set up your career profile to see personalized job listings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Job Opportunities</h2>
            <p className="text-muted-foreground">Find your next career opportunity</p>
          </div>
          <Button className="hover-lift">
            <Bookmark className="h-4 w-4 mr-2" />
            Saved Jobs
          </Button>
        </div>

        <Card className="p-4 shadow-md">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for jobs, companies, or skills..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="hover-lift">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </Card>

        <div className="flex gap-2 flex-wrap">
          {filters.map((filter, index) => (
            <Button
              key={index}
              variant={index === 0 ? "default" : "outline"}
              size="sm"
              className="hover-lift"
            >
              {filter.label}
              <Badge variant="secondary" className="ml-2">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {filteredJobs.filter((job) => job.featured).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <span className="text-secondary">⭐</span>
            Featured Opportunities
          </h3>
          <div className="grid gap-4">
            {filteredJobs
              .filter((job) => job.featured)
              .map((job, index) => (
                <Card
                  key={job.id}
                  className="p-6 hover-lift transition-all duration-300 animate-fade-in shadow-md border-l-4 border-l-primary"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-2xl font-semibold text-foreground">{job.title}</h3>
                          <Badge className="bg-secondary text-secondary-foreground">Featured</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {job.company}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </div>
                          {job.salary && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {job.salary}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">{job.type}</Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {job.skills.slice(0, 5).map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      {job.skills.length > 5 && (
                        <Badge variant="secondary">+{job.skills.length - 5}</Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Posted {job.posted}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="hover-lift">
                          <Bookmark className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          className="hover-lift"
                          onClick={() => window.open(job.applyLink, "_blank")}
                        >
                          Apply Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">
          All Positions ({filteredJobs.filter((job) => !job.featured).length})
        </h3>
        <div className="grid gap-4">
          {filteredJobs
            .filter((job) => !job.featured)
            .map((job, index) => (
              <Card
                key={job.id}
                className="p-6 hover-lift transition-all duration-300 animate-fade-in shadow-md"
                style={{ animationDelay: `${(index + (filteredJobs.filter(j => j.featured).length)) * 100}ms` }}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <h3 className="text-xl font-semibold text-foreground">{job.title}</h3>
                      <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {job.company}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        {job.salary && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {job.salary}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">{job.type}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {job.skills.slice(0, 5).map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                    {job.skills.length > 5 && (
                      <Badge variant="outline">+{job.skills.length - 5}</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Posted {job.posted}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="hover-lift">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="hover-lift"
                        onClick={() => window.open(job.applyLink, "_blank")}
                      >
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
        </div>
        {filteredJobs.length === 0 && jobs.length > 0 && (
          <p className="text-center text-muted-foreground py-8">No jobs match your search. Try different keywords.</p>
        )}
      </div>
    </div>
  );
};

export default Jobs;