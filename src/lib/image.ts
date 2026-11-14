/**
 * Prépare une photo avant de l'enregistrer : les photos de téléphone pèsent
 * souvent 3 à 8 Mo, on les réduit (côté le plus long : 1400 px, JPEG) pour
 * que la base locale reste légère. En cas de souci (format non géré par le
 * navigateur, par exemple), on garde simplement le fichier d'origine.
 */
export async function prepareImage(file: Blob, maxSide = 1400, quality = 0.85): Promise<Blob> {
  const keepAsIs = ['image/svg+xml', 'image/gif']
  if (!file.type.startsWith('image/') || keepAsIs.includes(file.type)) return file

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= 900_000) {
      bitmap.close()
      return file
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close()
      return file
    }
    // Fond blanc : les zones transparentes d'un PNG ne deviennent pas noires en JPEG.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const resized = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    return resized && resized.size < file.size ? resized : file
  } catch {
    return file
  }
}
