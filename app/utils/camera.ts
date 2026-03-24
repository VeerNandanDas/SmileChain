import { createClient } from '@supabase/supabase-js'

interface Image {
  url: string;
  timestamp: string;
  smileCount: number;
  smileScore: number;
  hasWon: boolean;
  isLoading: boolean;
  isNounish: boolean;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const checkCameraPermissions = async (): Promise<'granted' | 'denied' | 'prompt'> => {
  try {
    if (navigator.permissions) {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state as 'granted' | 'denied' | 'prompt';
    }
    return 'prompt';
  } catch {
    return 'prompt';
  }
};

export const initCamera = async (videoRef: React.RefObject<HTMLVideoElement>) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } }
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.style.transform = 'scaleX(-1)';
    }
  } catch (err) {
    console.error("Error accessing camera:", err);
    throw new Error("Unable to access camera. Please grant camera permissions.");
  }
};

export const uploadImage = async (blob: Blob, userId: string, isNounish: boolean) => {
  const fileName = `${userId}/${Date.now()}.jpg`;
  const { data, error } = await supabase.storage.from('smiles').upload(fileName, blob);
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('smiles').getPublicUrl(fileName);
  return { url: publicUrl, isNounish };
};

export const compressImage = async (blob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);
    img.src = objectUrl;
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 480, MAX_HEIGHT = 360;
      let width = img.width, height = img.height;
      if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
      else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Compression failed')), 'image/jpeg', 0.9);
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load image')); };
  });
};

export const loadExistingPhotos = async (): Promise<Image[]> => {
  const { data, error } = await supabase.from('photos').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data.map(p => ({
    url: p.image_url, timestamp: p.created_at, smileCount: p.smile_count || 0,
    smileScore: p.smile_score, hasWon: p.smile_score > 3, isLoading: false, isNounish: p.is_nounish || false,
  }));
};

export const handleSmileBack = async (imageUrl: string) => {
  const { data, error: fe } = await supabase.from('photos').select('smile_count').eq('image_url', imageUrl).single();
  if (fe) throw fe;
  const { error: ue } = await supabase.from('photos').update({ smile_count: (data.smile_count || 0) + 1 }).eq('image_url', imageUrl);
  if (ue) throw ue;
  return (data.smile_count || 0) + 1;
};

export const deletePhoto = async (imageUrl: string, userId: string) => {
  const { error: de } = await supabase.from('photos').delete().match({ user_id: userId, image_url: imageUrl });
  if (de) throw de;
  const fileName = imageUrl.split('/').pop();
  const { error: se } = await supabase.storage.from('smiles').remove([`${userId}/${fileName}`]);
  if (se) throw se;
};