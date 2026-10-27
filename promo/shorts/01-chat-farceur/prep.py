# Prépare les éléments : images au format 1080×1920, panier détouré + plaque propre, chat détouré recadré.
import sys, numpy as np, cv2
from PIL import Image, ImageFilter
S = sys.argv[1]; D = S + '/zip/Pack_Minuton'; A = S + '/assets'
noms = ['01_Accroche_chat_en_course','02_Minuton_surpris','03_Course_sur_la_feuille','04_Chat_baille_idee','05_Minuton_dessine_panier',
        '06_Chat_entre_dans_panier','07_Chat_endormi','08_Chat_attrape_crayon','09_Gros_plan_pattee_crayon','10_Minuton_amuse_chat_doudou']
for n in noms:
    Image.open(f'{D}/01_Images/{n}.png').convert('RGB').resize((1080,1920), Image.LANCZOS).save(f'{A}/{n[:2]}.png')
Image.open(f'{D}/03_Elements_animation/Fond_course_sans_chat.png').convert('RGB').resize((1080,1920), Image.LANCZOS).save(f'{A}/fond.png')
chat = Image.open(f'{D}/03_Elements_animation/Chat_course_transparent.png').convert('RGBA')
chat = chat.crop(chat.getbbox()); chat.save(f'{A}/chat.png'); print('chat', chat.size)

# Panier de la scène 05 : traits sombres dans la zone du panier, hors tête du chat.
im = np.array(Image.open(f'{A}/05.png').convert('RGB')).astype(np.float32)
lum = im.mean(axis=2)
h, w = lum.shape
yy, xx = np.mgrid[0:h, 0:w]
cx, cy, rx, ry = 783, 1462, 190, 140
zone = (((xx-cx)/rx)**2 + ((yy-cy)/ry)**2 <= 1.0) & (yy >= 1325)
chat_zone = (xx < 652) & (yy < 1430)
traits = (lum < 150) & zone & ~chat_zone
m = traits.astype(np.uint8)*255
m = cv2.dilate(m, np.ones((7,7),np.uint8))
m[~zone] = 0; m[chat_zone] = 0
plaque = cv2.inpaint(im.astype(np.uint8)[:, :, ::-1], m, 9, cv2.INPAINT_TELEA)[:, :, ::-1]
Image.fromarray(plaque).save(f'{A}/05_sans_panier.png')
Image.fromarray(m).filter(ImageFilter.GaussianBlur(1.2)).save(f'{A}/05_masque_panier.png')
print('pixels panier', int((m>0).sum()))
