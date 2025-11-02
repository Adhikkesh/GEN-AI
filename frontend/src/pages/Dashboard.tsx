import { Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Roadmap from "./Roadmap";
import News from "./News";
import Jobs from "./Jobs";

const Dashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
            <div className="h-full px-6 flex items-center gap-4">
              <SidebarTrigger className="hover:bg-accent" />
              <h1 className="text-xl font-bold text-foreground">Career Portal</h1>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route index element={<Roadmap />} />
              <Route path="news" element={<News />} />
              <Route path="jobs" element={<Jobs />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
