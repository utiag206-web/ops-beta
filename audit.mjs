import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kadxdfswqyhqqzyzzrte.supabase.co';
const supabaseKey = 'sb_secret__d8j8zevRq5zHpM2QIybjA_MkyvoL-r'; // Using service role key for audit
const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log("--- 1. Auditing operations_product_mapping ---");
  const { data: mappings, error: errMap } = await supabase.from('operations_product_mapping').select('*');
  console.log("Mappings Count:", mappings?.length);
  if (mappings?.length > 0) {
    console.table(mappings.map(m => ({
      id: m.id,
      company: m.company_id,
      operation_type: m.operation_type,
      column_name: m.column_name,
      product: m.product_id,
      is_active: m.is_active
    })));
  } else {
    console.log("NO MAPPINGS FOUND.");
  }

  console.log("\n--- 2. Auditing Movement Types ---");
  const { data: moveTypes } = await supabase.from('movement_types').select('*').eq('code', 'OPS_OUT_SIM');
  console.log("OPS_OUT_SIM types found:", moveTypes?.length);
  if (moveTypes?.length > 0) {
    console.table(moveTypes.map(m => ({id: m.id, company_id: m.company_id, code: m.code})));
  }

  console.log("\n--- 3. Auditing Inventory Movements for OPS_OUT_SIM ---");
  const { data: moves } = await supabase.from('inventory_movements').select('*').like('document_type', 'OPS');
  console.log("OPS Movements found:", moves?.length);
  if (moves?.length > 0) {
    console.log(moves);
  }

  console.log("\n--- 4. Checking recent production control records ---");
  const { data: prod } = await supabase.from('production_control').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Recent Production Records:");
  if (prod?.length > 0) {
    console.table(prod.map(p => ({
      id: p.id,
      warehouse_id: p.warehouse_id,
      nails_qty: p.nails_qty,
      cambuchos: p.cambuchos,
      chocolate_qty: p.chocolate_qty
    })));
  }
}

runAudit().catch(console.error);
