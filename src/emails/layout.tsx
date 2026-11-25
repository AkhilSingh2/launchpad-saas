import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

export function EmailLayout({
  preview,
  title,
  children,
  action,
}: {
  preview: string;
  title: string;
  children: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={card}>
          <Text style={mark}>LaunchPad</Text>
          <Heading style={heading}>{title}</Heading>
          <Section>{children}</Section>
          {action ? (
            <Button href={action.href} style={button}>
              {action.label}
            </Button>
          ) : null}
          <Hr style={rule} />
          <Text style={footer}>
            LaunchPad mission control. If you were not expecting this, you can ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailParagraph({ children }: { children: ReactNode }) {
  return <Text style={paragraph}>{children}</Text>;
}

const body = {
  backgroundColor: "#f3efe6",
  fontFamily: "Georgia, 'Times New Roman', serif",
  margin: "0",
  padding: "32px 12px",
};

const card = {
  backgroundColor: "#fffdf8",
  border: "1px solid #e3d9cc",
  borderRadius: "16px",
  margin: "0 auto",
  maxWidth: "520px",
  padding: "32px",
};

const mark = {
  color: "#d84a1b",
  fontFamily: "Arial, sans-serif",
  fontSize: "12px",
  letterSpacing: "0.16em",
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
};

const heading = {
  color: "#1a1714",
  fontSize: "28px",
  fontWeight: "500",
  lineHeight: "1.2",
  margin: "0 0 16px",
};

const paragraph = {
  color: "#3f3a34",
  fontFamily: "Arial, sans-serif",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const button = {
  backgroundColor: "#1a1714",
  borderRadius: "999px",
  color: "#f6f1e7",
  display: "inline-block",
  fontFamily: "Arial, sans-serif",
  fontSize: "14px",
  padding: "12px 18px",
  textDecoration: "none",
};

const rule = { borderColor: "#e3d9cc", margin: "24px 0" };

const footer = {
  color: "#6b645c",
  fontFamily: "Arial, sans-serif",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};
