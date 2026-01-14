import RequireAuth from "./RequireAuth";
import Home from "./components/Home";

export default function App() {
  return (
    <RequireAuth>
      <Home />
    </RequireAuth>
  );
}
