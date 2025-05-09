import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Se o usuário estiver autenticado e não estiver carregando, redirecione para a dashboard
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) throw error;
      
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Erro ao entrar",
        description: error.message,
        variant: "destructive",
      });
      setError("Credenciais inválidas. Por favor, verifique seu e-mail e senha.");
    }
  };

  // Enquanto estiver carregando, não mostra nada
  if (loading) return null;

  // Se já estiver autenticado, não mostra a página de login
  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md bg-zinc-900 rounded-lg p-8 shadow-xl">
        <div className="flex flex-col items-center justify-center mb-8">
          {/* Logo */}
          <div className="w-48 h-48 flex items-center justify-center mb-6">
            <img 
              src="/Control.png" 
              alt="Control Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-1">Entrar</h1>
          
          <p className="text-zinc-400 text-sm">para continuar em Control</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Seu e-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Digite o endereço de e-mail"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent text-zinc-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showPassword ? "Ocultar senha" : "Mostrar senha"}
                </span>
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 mt-6">
            Entrar
          </Button>
        </form>
            
        <div className="text-center mt-8 text-xs text-zinc-500">
          Secured by <span className="font-semibold">Control</span>
        </div>
            
        <div className="text-center mt-4 text-xs text-zinc-500">
          <p>Para obter acesso ao sistema, entre em contato com o administrador</p>
        </div>
      </div>
    </div>
  );
}
