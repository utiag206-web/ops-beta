import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kadxdfswqyhqqzyzzrte.supabase.co';
const supabaseKey = 'sb_secret__d8j8zevRq5zHpM2QIybjA_MkyvoL-r';
const supabase = createClient(supabaseUrl, supabaseKey);

const PRODUCTION_MAPPINGS = [
  { column: 'nails_qty', name: 'Clavos', unit: 'UND', category: 'Herramientas', type: 'material' },
  { column: 'cambuchos', name: 'Cambuchos', unit: 'UND', category: 'Consumibles', type: 'material' },
  { column: 'chocolate_qty', name: 'Chocolate', unit: 'UND', category: 'Consumibles', type: 'material' }
];

const WOOD_MAPPINGS = [
  { column: 'boards_2in', name: 'Tablas 2"', unit: 'UND', category: 'Madera', type: 'material' },
  { column: 'rajas', name: 'Rajas', unit: 'UND', category: 'Madera', type: 'material' },
  { column: 'strut_8in', name: 'Puntal 8"', unit: 'UND', category: 'Madera', type: 'material' },
  { column: 'strut_6in', name: 'Puntal 6"', unit: 'UND', category: 'Madera', type: 'material' },
  { column: 'strut_4in', name: 'Puntal 4"', unit: 'UND', category: 'Madera', type: 'material' }
];

async function seed() {
  console.log("Starting seed script...");

  // 1. Get all companies
  const { data: companies, error: compErr } = await supabase.from('companies').select('id, name');
  if (compErr) throw compErr;

  for (const company of companies) {
    console.log(`\n--- Processing Company: ${company.name} ---`);
    const companyId = company.id;

    // Get a default warehouse for the company
    let { data: whs } = await supabase.from('warehouses').select('id').eq('company_id', companyId).limit(1);
    let defaultWh = whs && whs.length > 0 ? whs[0].id : null;

    if (!defaultWh) {
      console.log("No warehouse found for company, creating one...");
      const { data: newWh } = await supabase.from('warehouses').insert({
        company_id: companyId,
        name: 'Almacén Principal',
        code: 'ALM-1'
      }).select().single();
      defaultWh = newWh.id;
    }

    console.log(`Default Warehouse ID: ${defaultWh}`);

    // Helper to get or create product
    const getOrCreateProduct = async (prodDef) => {
      let { data: existing } = await supabase.from('products')
        .select('id').eq('company_id', companyId).eq('name', prodDef.name).maybeSingle();
      
      if (existing) return existing.id;
      
      console.log(`Creating product: ${prodDef.name}`);
      const { data: newProd, error } = await supabase.from('products').insert({
        company_id: companyId,
        name: prodDef.name,
        code: `OPS-${prodDef.column.toUpperCase().substring(0, 4)}`,
        unit: prodDef.unit,
        category: prodDef.category,
        type: prodDef.type,
        min_stock: 0,
        has_expiry: false
      }).select().single();
      
      if (error) {
        console.error("Error creating product:", error.message);
        return null;
      }
      return newProd.id;
    };

    // 2. Setup Mappings
    const setupMappings = async (mappings, opType) => {
      for (const mapDef of mappings) {
        const prodId = await getOrCreateProduct(mapDef);
        if (!prodId) continue;
        
        // Upsert mapping
        const { error: mapErr } = await supabase.from('operations_product_mapping').upsert({
          company_id: companyId,
          operation_type: opType,
          column_name: mapDef.column,
          product_id: prodId,
          unit_ratio: 1.0,
          is_active: true
        }, { onConflict: 'company_id, operation_type, column_name' });
        
        if (mapErr) console.error(`Error mapping ${mapDef.column}:`, mapErr.message);
      }
    };

    await setupMappings(PRODUCTION_MAPPINGS, 'production');
    await setupMappings(WOOD_MAPPINGS, 'wood');
    console.log("Mappings seeded.");

    // 3. Update Historical Records & Sync Inventory
    const processRecords = async (table, mappings, opType) => {
      const { data: records } = await supabase.from(table).select('*').eq('company_id', companyId);
      console.log(`Found ${records?.length || 0} records in ${table}`);

      const { data: moveType } = await supabase.from('movement_types')
        .select('id').eq('company_id', companyId).eq('code', 'OPS_OUT_SIM').single();
      
      if (!moveType) {
        console.log("No OPS_OUT_SIM found, skipping...");
        return;
      }

      for (const record of (records || [])) {
        // Update warehouse_id if missing
        if (!record.warehouse_id) {
          await supabase.from(table).update({ warehouse_id: defaultWh }).eq('id', record.id);
          record.warehouse_id = defaultWh;
        }

        // Clean previous links (idempotency)
        const { data: existingLinks } = await supabase.from('operations_inventory_link')
          .select('movement_id').eq('company_id', companyId).eq('source_type', opType).eq('source_id', record.id);
        
        if (existingLinks && existingLinks.length > 0) {
          const moveIds = existingLinks.map(l => l.movement_id);
          await supabase.from('inventory_movements').delete().in('id', moveIds);
        }

        // Generate new movements
        const newMovements = [];
        const workplaceName = record.workplace || 'Desconocido';

        for (const mapDef of mappings) {
          const { data: mapping } = await supabase.from('operations_product_mapping')
            .select('*').eq('company_id', companyId).eq('operation_type', opType).eq('column_name', mapDef.column).single();
            
          if (!mapping) continue;

          const rawValue = record[mapping.column_name];
          const qty = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);

          if (qty && !isNaN(qty) && qty > 0) {
            newMovements.push({
              company_id: companyId,
              product_id: mapping.product_id,
              warehouse_id: record.warehouse_id,
              user_id: record.created_by,
              created_by: record.created_by,
              movement_type_id: moveType.id,
              quantity: qty * (mapping.unit_ratio || 1),
              type: 'salida',
              document_type: 'OPS',
              document_number: `REQ-${opType.substring(0, 3).toUpperCase()}-${record.id.split('-')[0]}`,
              observation: `Consumo Operacional Simulado - Labor: ${workplaceName}`
            });
          }
        }

        if (newMovements.length > 0) {
          const { data: insertedMoves, error: insErr } = await supabase.from('inventory_movements').insert(newMovements).select('id');
          if (insErr) {
            console.error("Error inserting moves:", insErr.message);
          } else if (insertedMoves) {
            const links = insertedMoves.map(m => ({
              company_id: companyId,
              source_type: opType,
              source_id: record.id,
              movement_id: m.id
            }));
            await supabase.from('operations_inventory_link').insert(links);
          }
        }
      }
    };

    await processRecords('production_control', PRODUCTION_MAPPINGS, 'production');
    await processRecords('wood_control', WOOD_MAPPINGS, 'wood');
    console.log(`Company ${company.name} processing complete.`);
  }

  console.log("Seed and historical processing finished successfully.");
}

seed().catch(console.error);
