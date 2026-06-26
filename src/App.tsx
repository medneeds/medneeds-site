import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/config/routes/ProtectedRoute.tsx";
import { AuthProvider } from "@/contexts/auth/AuthContext.tsx";
import { InstitutionalProvider } from "@/contexts/institution/InstitutionalContext.tsx";
import { UserModeProvider } from "@/contexts/user/UserModeContext.tsx";
import { ThemeProvider } from "@/ui/providers";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// Pages
import Index from "./pages";
import Auth from "./pages/auth/Auth.tsx";
import Dashboard from "./pages/dashboard/Dashboard.tsx";
import Applications from "./pages/jobs/Applications.tsx";
import Jobs from "./pages/jobs/Jobs.tsx";
import Preferences from "./pages/profile/Preferences.tsx";
import Profile from "./pages/profile/Profile.tsx";
import Schedule from "./pages/schedule/Schedule.tsx";
import Transferencias from "./pages/transfers";
import Recebimentos from "./pages/wallet";

import NotFound from "./pages/fallback/NotFound.tsx";
import ForgotPassword from "./pages/forgotPassword/ForgotPassword.tsx";
import InstitutionalSignup from "./pages/institution/InstitutionalSignup.tsx";
import InstitutionalDashboard from "./pages/institution/InstitutionalDashboard.tsx";
import InstitutionalPermissions from "./pages/institution/InstitutionalPermissions.tsx";
import InstitutionalInvites from "./pages/institution/InstitutionalInvites.tsx";
import InstitutionalTeams from "./pages/institution/InstitutionalTeams.tsx";
import InstitutionalVision from "./pages/institution/InstitutionalVision.tsx";
import InstitutionalRegistration from "./pages/institution/InstitutionalRegistration.tsx";
import AdminCreateInstitution from "./pages/admin/AdminCreateInstitution.tsx";

// Gestor Pages

// Admin Pages

const queryClient = new QueryClient();

import { GlobalLoading } from "@/components/ui/GlobalLoading";
import RedirectOffer from "@/pages/RedirectOffer.tsx";

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <InstitutionalProvider>
          <UserModeProvider>
            <TooltipProvider>
              <GlobalLoading />
              <Toaster />
              <Sonner />
            <Routes>
              {/* Landing Page */}
              <Route path="/" element={<Index />} />
              {/* Auth Routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/forgot" element={<ForgotPassword />} />
              {/* Main App Routes - Protected */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agenda"
                element={
                  <ProtectedRoute>
                    <Schedule />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ofertas"
                element={
                  <ProtectedRoute>
                    <Jobs />
                  </ProtectedRoute>
                }
              />
              <Route path="/oferta/:id" element={<RedirectOffer />} />
              <Route
                path="/recebimentos"
                element={
                  <ProtectedRoute>
                    <Recebimentos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/solicitacoes"
                element={
                  <ProtectedRoute>
                    <Applications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transferencias"
                element={
                  <ProtectedRoute>
                    <Transferencias />
                  </ProtectedRoute>
                }
              />
              {/*TODO: Será implementado posteriormente*/}
              {/*<Route path="/grupos" element={<ProtectedRoute><Grupos /></ProtectedRoute>} />*/}
              {/*<Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />*/}
              {/*<Route path="/chat/:groupId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />*/}
              {/*<Route path="/postagens" element={<ProtectedRoute><Postagens /></ProtectedRoute>} />*/}
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/preferencias"
                element={
                  <ProtectedRoute>
                    <Preferences />
                  </ProtectedRoute>
                }
              />

              {/* Gestor Routes - Protected */}
              {/*TODO: Será implementado posteriormente*/}
              {/*<Route path="/gestor/login" element={<GestorLogin />} />*/}
              {/*<Route path="/gestor" element={<GestorAuthGuard><GestorEscalasPage /></GestorAuthGuard>} />*/}
              {/*<Route path="/gestor/instituicoes" element={<GestorAuthGuard><GestorInstituicoesPage /></GestorAuthGuard>} />*/}
              {/*<Route path="/gestor/setores" element={<GestorAuthGuard><GestorSetoresPage /></GestorAuthGuard>} />*/}
              {/*<Route path="/gestor/equipes" element={<GestorAuthGuard><GestorEquipesPage /></GestorAuthGuard>} />*/}
              {/*<Route path="/gestor/permutas" element={<GestorAuthGuard><GestorPermutasPage /></GestorAuthGuard>} />*/}
              {/*<Route path="/gestor/chat" element={<GestorAuthGuard><GestorChatPage /></GestorAuthGuard>} />*/}

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminCreateInstitution />} />

              {/* Institution Routes */}
              <Route path="/cadastro-institucional" element={<InstitutionalSignup />} />
              <Route
                path="/institucional"
                element={
                  <ProtectedRoute>
                    <InstitutionalVision />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/institucional/permissoes"
                element={
                  <ProtectedRoute>
                    <InstitutionalPermissions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/institucional/convites"
                element={
                  <ProtectedRoute>
                    <InstitutionalInvites />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/institucional/times"
                element={
                  <ProtectedRoute>
                    <InstitutionalTeams />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/institucional/cadastro"
                element={
                  <ProtectedRoute>
                    <InstitutionalRegistration />
                  </ProtectedRoute>
                }
              />
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </UserModeProvider>
        </InstitutionalProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
