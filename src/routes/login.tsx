import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { MercuryBackground } from "@/components/ui/mercury-background";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error("Supabase is not configured.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || "KITS Student",
            },
          },
        });

        if (error) throw error;
        toast.success("Account created successfully! Check your email or try signing in.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Welcome back to KITS Hub!");
        navigate({ to: "/" });
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mercury-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;800&family=Space+Mono&display=swap');

        :root {
          --bg: #050505;
          --mercury: #e0e0e0;
          --mercury-dark: #666666;
          --accent: #ffffff;
          --text-dim: rgba(255, 255, 255, 0.5);
          --filter-goo: url('#gooey');
        }

        .mercury-wrapper {
          background-color: var(--bg);
          color: var(--accent);
          font-family: 'Inter', sans-serif;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .mercury-wrapper * {
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
        }

        /* Interface Container */
        .auth-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          padding: 40px;
        }

        .header {
          margin-bottom: 60px;
          text-align: left;
        }

        .brand-id {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 8px;
          display: block;
        }

        .header h1 {
          font-weight: 800;
          font-size: 3rem;
          line-height: 0.9;
          letter-spacing: -2px;
          margin-left: -4px;
          margin-top: 0;
          color: var(--accent);
        }

        /* Form Elements */
        .form-group {
          position: relative;
          margin-bottom: 30px;
          transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
        }

        .form-group:focus-within {
          transform: translateX(10px);
        }

        .form-group label {
          display: block;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .form-group input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--accent);
          padding: 12px 0;
          font-size: 18px;
          outline: none;
          transition: border-color 0.4s;
        }

        .input-glow {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0%;
          height: 2px;
          background: var(--mercury);
          transition: width 0.6s cubic-bezier(0.2, 1, 0.3, 1);
          box-shadow: 0 0 15px var(--mercury);
        }

        .form-group input:focus + .input-glow {
          width: 100%;
        }

        /* The Mercury Button */
        .submit-wrap {
          margin-top: 50px;
          position: relative;
          filter: var(--filter-goo);
        }

        .btn-base {
          background: var(--accent);
          color: #000;
          border: none;
          padding: 20px 40px;
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          cursor: pointer;
          width: 100%;
          position: relative;
          z-index: 2;
          transition: letter-spacing 0.3s;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-base:hover {
          letter-spacing: 4px;
        }

        .mercury-drop {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          background: var(--mercury);
          transform: translate(-50%, -50%);
          z-index: 1;
          border-radius: 50px;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .submit-wrap:hover .mercury-drop {
          transform: translate(-50%, -50%) scale(1.05, 1.2);
          filter: brightness(1.2);
        }

        /* Utility */
        .footer-nav {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
        }

        .footer-nav button {
          background: none;
          border: none;
          color: var(--text-dim);
          text-decoration: none;
          transition: color 0.3s;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .footer-nav button:hover {
          color: var(--accent);
        }
      `}</style>

      {/* Liquid physics background */}
      <MercuryBackground opacity={0.65} />

      <main className="auth-container">
        <header className="header">
          <span className="brand-id">Placement Portal: 0x2026</span>
          <h1>
            {isSignUp ? (
              <>PORTAL<br/>REGISTER</>
            ) : (
              <>PLACEMENT<br/>ACCESS</>
            )}
          </h1>
        </header>

        <form autoComplete="off" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label>Student Full Name</label>
              <input 
                type="text" 
                placeholder="AARAV SHARMA" 
                required 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <div className="input-glow"></div>
            </div>
          )}

          <div className="form-group">
            <label>College Email</label>
            <input 
              type="email" 
              placeholder="student@karunya.edu.in" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="input-glow"></div>
          </div>

          <div className="form-group">
            <label>Sequence Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="input-glow"></div>
          </div>

          <div className="submit-wrap">
            <div className="mercury-drop"></div>
            <button type="submit" className="btn-base" disabled={loading}>
              {loading ? "INITIALIZING..." : (isSignUp ? "INITIALIZE REGISTER" : "INITIALIZE LOGIN")}
            </button>
          </div>
        </form>

        <footer className="footer-nav">
          <button 
            type="button"
            onClick={() => toast.info("Contact KITS Placement Cell for password recovery assistance.")}
          >
            RECOVER PASSWORD
          </button>
          <button 
            type="button" 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setEmail("");
              setPassword("");
              setFullName("");
            }}
          >
            {isSignUp ? "RETURN TO LOGIN" : "CREATE ACCOUNT"}
          </button>
        </footer>
      </main>
    </div>
  );
}
