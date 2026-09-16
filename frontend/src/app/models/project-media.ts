export interface ProjectMedia {
  id: number;
  project_id: number;
  media_type: 'image' | 'video';
  cloudinary_public_id: string;
  url: string;
  sort_order: number;
  created_at: string;
}
