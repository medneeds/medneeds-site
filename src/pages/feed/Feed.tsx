import { MainLayout } from "@/components/layout/MainLayout.tsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Plus,
  TrendingUp,
  Users,
  Stethoscope,
  ChevronLeft
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Mock data for posts
const posts = [
  {
    id: 1,
    author: {
      name: "Dra. Maria Santos",
      specialty: "Cardiologista",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100"
    },
    content: "Caso clínico interessante: paciente masculino, 45 anos, apresentando dor torácica atípica. ECG inicial sem alterações significativas, mas troponina discretamente elevada. Qual seria a conduta inicial?",
    image: null,
    category: "Caso Clínico",
    likes: 42,
    comments: 18,
    shares: 5,
    saved: false,
    createdAt: "2h atrás"
  },
  {
    id: 2,
    author: {
      name: "Dr. João Oliveira",
      specialty: "Intensivista",
      avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100"
    },
    content: "Nova diretriz sobre manejo de sepse publicada! Principais mudanças incluem reavaliação dos critérios de ressuscitação volêmica. Recomendo a leitura para todos os colegas de UTI.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600",
    category: "Atualização",
    likes: 128,
    comments: 34,
    shares: 67,
    saved: true,
    createdAt: "5h atrás"
  },
  {
    id: 3,
    author: {
      name: "Dra. Ana Costa",
      specialty: "Emergencista",
      avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100"
    },
    content: "Dica rápida: na avaliação de dispneia aguda, não esqueçam do D-dímero ajustado pela idade em pacientes > 50 anos. Fórmula: idade x 10 como cut-off. Simples e eficaz! 🩺",
    image: null,
    category: "Dica Clínica",
    likes: 89,
    comments: 12,
    shares: 23,
    saved: false,
    createdAt: "1d atrás"
  }
];

const categories = [
  { id: "all", label: "Todos", icon: TrendingUp },
  { id: "casos", label: "Casos Clínicos", icon: Stethoscope },
  { id: "atualizacoes", label: "Atualizações", icon: TrendingUp },
  { id: "comunidade", label: "Comunidade", icon: Users },
];

export default function Feed() {
  const navigate = useNavigate();
  
  return (
    <MainLayout mobileTitle="Feed" showMobileBack>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="h-9 w-9 rounded-lg hover:bg-secondary hidden md:flex"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Feed</h1>
              <p className="text-muted-foreground">Atualizações da comunidade médica</p>
            </div>
          </div>
          <Button className="bg-primary text-primary-foreground gap-2">
            <Plus className="w-4 h-4" />
            Nova Postagem
          </Button>
        </div>

        {/* Category Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap">
            {categories.map((cat) => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="gap-2 data-[state=active]:bg-background"
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={post.author.avatar} alt={post.author.name} />
                          <AvatarFallback>{post.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{post.author.name}</p>
                          <p className="text-sm text-muted-foreground">{post.author.specialty} • {post.createdAt}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                    </div>
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                      {post.category}
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-foreground leading-relaxed">{post.content}</p>
                    
                    {post.image && (
                      <img 
                        src={post.image} 
                        alt="Post" 
                        className="w-full rounded-lg object-cover max-h-80"
                      />
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-red-500">
                          <Heart className="w-5 h-5" />
                          <span>{post.likes}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                          <MessageCircle className="w-5 h-5" />
                          <span>{post.comments}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                          <Share2 className="w-5 h-5" />
                          <span>{post.shares}</span>
                        </Button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={post.saved ? "text-primary" : "text-muted-foreground"}
                      >
                        <Bookmark className="w-5 h-5" fill={post.saved ? "currentColor" : "none"} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          {/* Placeholder for other tabs */}
          {["casos", "atualizacoes", "comunidade"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Filtrando por categoria...</p>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
}
