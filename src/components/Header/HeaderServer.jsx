// components/HeaderServer.jsx (SERVER)
import { CategoryMenu, Header } from "@/components"; // server component

export default function HeaderServer() {
  return <Header categoryMenuSlot={<CategoryMenu />} />;
}
