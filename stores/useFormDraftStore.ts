import { create } from "zustand";
import { persist } from "zustand/middleware";

type DraftMap = Record<string, any>;

interface FormDraftState {
  drafts: DraftMap;
  setDraft: (key: string, data: any) => void;
  clearDraft: (key: string) => void;
}

export const useFormDraftStore = create<FormDraftState>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (key, data) =>
        set((state) => ({
          drafts: { ...state.drafts, [key]: data },
        })),
      clearDraft: (key) =>
        set((state) => {
          const updated = { ...state.drafts };
          delete updated[key];
          return { drafts: updated };
        }),
    }),
    {
      name: "form-drafts",
    }
  )
);
