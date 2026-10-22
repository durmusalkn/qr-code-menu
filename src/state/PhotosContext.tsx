import { useSQLiteContext } from 'expo-sqlite';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { deletePhotoRow, insertPhoto, listPhotos, Photo, updatePhotoDay } from '../db/photos';
import type { DayKey } from '../lib/dates';
import { deletePhotoFile, importPhotoFile } from '../lib/storage';

export type NewPhoto = { uri: string; day: DayKey; width: number | null; height: number | null };

type PhotosContextValue = {
  photos: Photo[];
  loading: boolean;
  addPhotos: (items: NewPhoto[]) => Promise<void>;
  movePhoto: (id: number, day: DayKey) => Promise<void>;
  deletePhoto: (photo: Photo) => Promise<void>;
};

const PhotosContext = createContext<PhotosContextValue | null>(null);

export function PhotosProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setPhotos(await listPhotos(db));
  }, [db]);

  useEffect(() => {
    let active = true;
    listPhotos(db).then((rows) => {
      if (!active) return;
      setPhotos(rows);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [db]);

  const addPhotos = useCallback(
    async (items: NewPhoto[]) => {
      try {
        for (const item of items) {
          const fileName = await importPhotoFile(item.uri);
          try {
            await insertPhoto(db, { day: item.day, fileName, width: item.width, height: item.height });
          } catch (e) {
            deletePhotoFile(fileName);
            throw e;
          }
        }
      } finally {
        await reload();
      }
    },
    [db, reload]
  );

  const movePhoto = useCallback(
    async (id: number, day: DayKey) => {
      await updatePhotoDay(db, id, day);
      await reload();
    },
    [db, reload]
  );

  const deletePhoto = useCallback(
    async (photo: Photo) => {
      await deletePhotoRow(db, photo.id);
      deletePhotoFile(photo.fileName);
      await reload();
    },
    [db, reload]
  );

  const value = useMemo(
    () => ({ photos, loading, addPhotos, movePhoto, deletePhoto }),
    [photos, loading, addPhotos, movePhoto, deletePhoto]
  );

  return <PhotosContext.Provider value={value}>{children}</PhotosContext.Provider>;
}

export function usePhotos(): PhotosContextValue {
  const value = useContext(PhotosContext);
  if (!value) throw new Error('usePhotos must be used inside <PhotosProvider>');
  return value;
}
