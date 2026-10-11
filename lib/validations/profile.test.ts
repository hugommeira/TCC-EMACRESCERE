import { describe, expect, it } from "vitest";
import { avatarMimeFromBytes, changePasswordSchema, doctorEducationSchema, updateProfileSchema } from "./profile";

describe("updateProfileSchema", () => {
  it("campo em branco vira null (apaga o valor)", () => {
    const r = updateProfileSchema.parse({ phone: "", bloodType: "", heightCm: "", notes: "  ", birthDate: "" });
    expect(r).toMatchObject({ phone: null, bloodType: null, heightCm: null, notes: null, birthDate: null });
  });

  it("telefone com máscara chega só com dígitos", () => {
    expect(updateProfileSchema.parse({ phone: "(11) 98765-4321" }).phone).toBe("11987654321");
    expect(updateProfileSchema.safeParse({ phone: "1234" }).success).toBe(false);
  });

  it("data de nascimento fica à meia-noite de Brasília", () => {
    const d = updateProfileSchema.parse({ birthDate: "1991-03-14" }).birthDate;
    expect(d?.toISOString()).toBe("1991-03-14T03:00:00.000Z");
    expect(updateProfileSchema.safeParse({ birthDate: "2999-01-01" }).success).toBe(false);
  });

  it("alergias sem itens vazios nem repetidos", () => {
    expect(updateProfileSchema.parse({ allergies: ["Dipirona", " ", "Dipirona", "Látex"] }).allergies)
      .toEqual(["Dipirona", "Látex"]);
  });

  it("recusa tipo sanguíneo inventado e nome com símbolos", () => {
    expect(updateProfileSchema.safeParse({ bloodType: "Z+" }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ name: "<script>" }).success).toBe(false);
  });

  it("meta de peso e altura dentro dos limites do IMC", () => {
    expect(updateProfileSchema.parse({ heightCm: "165", goalWeightKg: "72.5" }))
      .toMatchObject({ heightCm: 165, goalWeightKg: 72.5 });
    expect(updateProfileSchema.safeParse({ heightCm: "10" }).success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  const ok = { currentPassword: "Antiga@123", newPassword: "Nova@2026x", confirmPassword: "Nova@2026x" };

  it("aceita senha forte confirmada", () => {
    expect(changePasswordSchema.safeParse(ok).success).toBe(true);
  });

  it("recusa confirmação diferente, senha fraca e senha igual à atual", () => {
    expect(changePasswordSchema.safeParse({ ...ok, confirmPassword: "outra" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ ...ok, newPassword: "fraca", confirmPassword: "fraca" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ ...ok, newPassword: ok.currentPassword, confirmPassword: ok.currentPassword }).success).toBe(false);
  });
});

describe("avatarMimeFromBytes", () => {
  it("reconhece JPEG, PNG e WebP pela assinatura", () => {
    expect(avatarMimeFromBytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(avatarMimeFromBytes(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(avatarMimeFromBytes(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe("image/webp");
  });

  it("recusa outro conteúdo com extensão de imagem (ex.: SVG/HTML)", () => {
    expect(avatarMimeFromBytes(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });
});

describe("contato de emergência e formação do médico", () => {
  it("contato de emergência: telefone só dígitos, vazio apaga", () => {
    expect(updateProfileSchema.parse({ emergencyContactName: "Maria", emergencyContactPhone: "(31) 3333-4444", emergencyContactRelation: "Mãe" }))
      .toMatchObject({ emergencyContactName: "Maria", emergencyContactPhone: "3133334444", emergencyContactRelation: "Mãe" });
    expect(updateProfileSchema.parse({ emergencyContactName: "", emergencyContactPhone: "" }))
      .toMatchObject({ emergencyContactName: null, emergencyContactPhone: null });
  });

  it("formação: ano no passado, idiomas sem repetição", () => {
    expect(doctorEducationSchema.parse({ graduationYear: "2012", languages: ["Inglês", "", "Inglês"] }))
      .toMatchObject({ graduationYear: 2012, languages: ["Inglês"] });
    expect(doctorEducationSchema.safeParse({ graduationYear: String(new Date().getFullYear() + 1) }).success).toBe(false);
    expect(doctorEducationSchema.parse({ graduationSchool: "", graduationYear: "" }))
      .toMatchObject({ graduationSchool: null, graduationYear: null });
  });
});
