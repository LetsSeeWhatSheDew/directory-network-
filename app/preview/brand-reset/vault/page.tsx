// Round 2 · Concept 1 "The Vault" — calm free home: one number, one store, one button.
import { getPreviewData } from "../data";
import { VaultShell, VaultHero, VaultAct } from "./parts";

export default async function VaultHome() {
  const data = await getPreviewData();
  const d = data.best;
  return (
    <VaultShell>
      {d ? <VaultHero d={d} hist={data.history} /> : <p className="vt-what">Nothing checked yet today.</p>}
      <div className="vt-spacer" />
      {d ? <VaultAct d={d} /> : null}
    </VaultShell>
  );
}
