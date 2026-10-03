import { describe, it, expect } from "vitest";
import { facebookProfileToUser } from "./facebook-profile";

describe("facebookProfileToUser", () => {
  it("usa avatarUrl (a tabela não tem coluna image)", () => {
    const u = facebookProfileToUser({
      id: "123", name: "Ana Souza", email: "Ana@Exemplo.com",
      picture: { data: { url: "https://graph.facebook.com/123/picture" } },
    });
    expect(u).toEqual({
      id: "123", role: "PATIENT", name: "Ana Souza", email: "ana@exemplo.com",
      avatarUrl: "https://graph.facebook.com/123/picture",
    });
    expect(u).not.toHaveProperty("image");
  });

  it("sem e-mail devolve null (o login é recusado depois)", () => {
    expect(facebookProfileToUser({ id: "9", name: "Bruno" }).email).toBeNull();
    expect(facebookProfileToUser({ id: "9", name: "Bruno", email: "  " }).email).toBeNull();
  });

  it("sem nome ou foto não quebra", () => {
    const u = facebookProfileToUser({ id: "7", picture: null });
    expect(u.name).toBe("Paciente");
    expect(u.avatarUrl).toBeNull();
  });
});
