import ContactUsComponent from "@/components/ContactUsComponent";
import { Metadata } from "next";

export const metadata = {
  title: "Contact Us - NovusMode",
  description:
    "Get in touch with NovusMode. Find our contact information, address, phone, and email. We're here to help!",
  keywords: "contact, contact us, customer support, novusmode",
};

export default function ContactUsPage() {
  return <ContactUsComponent />;
}
