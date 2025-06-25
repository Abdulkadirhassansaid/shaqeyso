
'use client'

import * as React from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import getCroppedImg from '@/lib/crop-image'
import { useLanguage } from '@/hooks/use-language'
import { Label } from './ui/label'

interface ImageCropperProps {
  image: string | null
  onCropComplete: (croppedImage: File) => void
  onClose: () => void
  aspect?: number
}

export function ImageCropper({
  image,
  onCropComplete,
  onClose,
  aspect = 1,
}: ImageCropperProps) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null)
  const { t } = useLanguage();

  const handleCropComplete = React.useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleSave = async () => {
    if (image && croppedAreaPixels) {
      const croppedImageFile = await getCroppedImg(image, croppedAreaPixels)
      if (croppedImageFile) {
        onCropComplete(croppedImageFile)
      }
      onClose()
    }
  }

  if (!image) {
    return null
  }

  return (
    <Dialog open={!!image} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.cropImage}</DialogTitle>
        </DialogHeader>
        <div className="relative h-80 w-full bg-muted">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>
        <div className="space-y-2">
          <Label>{t.zoom}</Label>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={(value) => setZoom(value[0])}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button onClick={handleSave}>{t.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
