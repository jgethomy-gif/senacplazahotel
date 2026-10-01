import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import "./App.css";

import Accueil from "./pages/Accueil";
import Cadastro from "./pages/Cadastro";
import Login from "./pages/Login";
import Comportamento from "./pages/Comportamento";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/comportamento" element={<Comportamento />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;