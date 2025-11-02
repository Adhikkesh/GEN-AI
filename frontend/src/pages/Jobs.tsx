import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Building2, DollarSign, Search, Filter, Bookmark } from "lucide-react";

const jobsData = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechCorp Solutions",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$120k - $160k",
    skills: ["React", "TypeScript", "Tailwind CSS"],
    posted: "2 days ago",
    featured: true,
  },
  {
    id: 2,
    title: "Full Stack Engineer",
    company: "Innovation Labs",
    location: "Remote",
    type: "Full-time",
    salary: "$100k - $140k",
    skills: ["Node.js", "React", "PostgreSQL"],
    posted: "3 days ago",
    featured: true,
  },
  {
    id: 3,
    title: "DevOps Engineer",
    company: "CloudNine Systems",
    location: "New York, NY",
    type: "Full-time",
    salary: "$110k - $150k",
    skills: ["AWS", "Docker", "Kubernetes"],
    posted: "5 days ago",
    featured: false,
  },
  {
    id: 4,
    title: "UI/UX Designer",
    company: "Design Studio Pro",
    location: "Austin, TX",
    type: "Contract",
    salary: "$80k - $100k",
    skills: ["Figma", "Adobe XD", "Prototyping"],
    posted: "1 week ago",
    featured: false,
  },
  {
    id: 5,
    title: "Backend Developer",
    company: "Data Dynamics",
    location: "Seattle, WA",
    type: "Full-time",
    salary: "$115k - $145k",
    skills: ["Python", "Django", "Redis"],
    posted: "1 week ago",
    featured: false,
  },
  {
    id: 6,
    title: "Mobile App Developer",
    company: "AppWorks Inc",
    location: "Remote",
    type: "Full-time",
    salary: "$105k - $135k",
    skills: ["React Native", "iOS", "Android"],
    posted: "2 weeks ago",
    featured: false,
  },
];

const filters = [
  { label: "All Jobs", count: jobsData.length },
  { label: "Remote", count: 2 },
  { label: "Full-time", count: 5 },
  { label: "Contract", count: 1 },
];

const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState("");

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

        {/* Search Bar */}
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

        {/* Filter Chips */}
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

      {/* Featured Jobs */}
      {jobsData.filter(job => job.featured).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <span className="text-secondary">⭐</span>
            Featured Opportunities
          </h3>
          <div className="grid gap-4">
            {jobsData
              .filter(job => job.featured)
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
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {job.salary}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">{job.type}</Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Posted {job.posted}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="hover-lift">
                          <Bookmark className="h-4 w-4" />
                        </Button>
                        <Button size="sm" className="hover-lift">Apply Now</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* All Jobs */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">All Positions</h3>
        <div className="grid gap-4">
          {jobsData
            .filter(job => !job.featured)
            .map((job, index) => (
              <Card
                key={job.id}
                className="p-6 hover-lift transition-all duration-300 animate-fade-in shadow-md"
                style={{ animationDelay: `${(index + 2) * 100}ms` }}
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
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {job.salary}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{job.type}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Posted {job.posted}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="hover-lift">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="hover-lift">Apply Now</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
