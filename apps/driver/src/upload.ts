// Uploads proof-of-delivery files to private storage. Paths are {org_id}/{order_id}/{file} — the storage
// rules only let a driver write inside their own company's folder.
import { File } from 'expo-file-system';
import { supabase } from './supabase';

export async function uploadPhoto(orgId: string, orderId: string, name: string, uri: string): Promise<string> {
  const bytes = await new File(uri).bytes();
  const path = `${orgId}/${orderId}/${name}.jpg`;
  const { error } = await supabase.storage.from('pod-photos').upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return path;
}

export async function uploadSignature(orgId: string, orderId: string, name: string, svg: string): Promise<string> {
  const bytes = new TextEncoder().encode(svg);
  const path = `${orgId}/${orderId}/${name}.svg`;
  const { error } = await supabase.storage.from('signatures').upload(path, bytes, { contentType: 'image/svg+xml', upsert: true });
  if (error) throw new Error(`Signature upload failed: ${error.message}`);
  return path;
}
