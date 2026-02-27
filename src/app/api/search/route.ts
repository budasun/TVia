import { NextResponse } from 'next/server';
import type { UnifiedMedia, MediaCategory, CategoryFilter } from '@/types';
import YouTube from 'youtube-sr';

const searchCache = new Map<string, { timestamp: number; data: UnifiedMedia[] }>();
const CACHE_DURATION = 1000 * 60 * 60 * 2;

const SIMPSONS_EPISODES: UnifiedMedia[] = [
  { id: 'simpsons-09x25', title: '09x25 - Marge, ¿puedo dormir con el perro?', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dxrk6YPxR6NP1lo9G_2TpqtfACD2vmyYSCushc1e9Q2DZhCV8g3XuK_UHBxtjSp5sEB-27WAmWsfmeuwmFnIiWBnUKSC-SgJr5hvRq_mZnN6rILPrXcCVwCHuQai-fZhz8hX04', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 25', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x24', title: '09x24 - Hemos perdido a nuestra Lisa', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dx2cHE6ePmZvqlLWVu1-ZZ2R4U5uN52-pvgnUgyJk4rbeLfGZ5Ugil0BW_V6B1eHBVqWmdFYusggjX-V156wjr6Ud-bzWuMDF67k9lvQbDNuH6MkfkLOzXm-PGhfhy9E93IyQM', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 24', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x23', title: '09x23 - El rey de la colina', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dwDqfzISFmsRYzy13luFeDIl1oiL93YHakOgaHpX0f7lLr0futSkCEr4bHaxTHThceAxLjI_iPgdYRWnBDLcyNdI0deaPtfjmYcMmRIdA9EB43LRbLJOSNIt2C7kiOrNJHBl3o', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 23', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x22', title: '09x22 - Basura de Titanes', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dyqv9vTp2vx0qNQnOwIRwqdTe4qVbhYgj5Krly01z-nrNYKMaeEqTEF4Xv4KBnMZUj6invOexNbsr2XltcRE1m_heeWqUio0CSzqjIxULWNO4ADrdI7hHPRaFfArVCyM9iBSAdg', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 22', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x21', title: '09x21 - Lisa comentarista', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dyBynpBcLrlEq8emZy2Kto_rLoOsUXy4W8aNbSMHsHuUG2Ki2_gYO38DIl2Ntb4CpSiYrgYMa8zGfcpqJmjD7yuFrpk-T3P0RnX-4jTCrCM72v1Ffx_4J_FrqMwgxCqhwJxnZg', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 21', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x20', title: '09x20 - Misión Deducible', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dwo1OtWcbggFPBIOr9eXrveXPIAg5fr6K4DxZGvihi2WQaq1djq65Z3A7chH3zL2wpjl0E29e54J6Rppakz1SqtPumnTuCyrl1lTeLSPdRgUcbucuWCod4No-a-iCCIhiBeyoM', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 20', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x19', title: '09x19 - Mi querido capitán Simpson', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dz1nCoUu5AqJ7UESv5ow58pslYGwKPj1W2CFovEGB1jgj5XrGB8t5oR1Rjk_xIceyNpUUO7ag4ZMEe-13qD1FtPgMHG42SrG9Kvl_NqeP_jPspDcQSmpZWcuAWhAy_qKIomiBk', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 19', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x18', title: '09x18 - Gorgorito', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dzbK6XfWcYz8XCP__EzWKAhttSj5TwqwIsOrkm8GUV-dPmzH5_4ifi78UlKuCmIopanQDtU7ElZhl9M8TfZfuyNOBF4fx5QnlMXo5QbI7N2Dzlsc8nxRm5ihoAaLMQzDZ42NWlp', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 18', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x17', title: '09x17 - Lisa, Simpson', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dxA7AsK3tggbObuNODnCzui3oSFD5wdsRDApBUcwG3tZG9w8FBCNlN4beVMOHZjuFW2SPXqaU-TM1OE4_mEnSH8XCOAUyVfxUS4U_aLtG3ttoejL-eqw6bNJR_uFFjlWPPn53OB', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 17', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x16', title: '09x16 - El bueno, la mala y el feo', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dwcObaSW9SBchhHgjhxx0UySDqsLHtIUmbEJC0VPd-SifA9KXoTG_KTNt7pQikuVOOFVUDQhqxOPFOsapFcCZ37tb20X-8eDg0WM1QYdC3dwuj13pDeJNl4rsIQ7rVIGj7QIr8', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 16', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x15', title: '09x15 - La última tentación de Krusty', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dy3kyAHweoJTPhyoB4f5nawKLcCmztyaCpgs-dTpBpL7dH-jTXZZlDaQypfzHYpYhq_kf2nR6u0v7xi2zZ6cE_UlkxUhfJju1rhF-mHJw9IolLYMNlSjexIp17QaJTIKh8pMfFC', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 15', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x14', title: '09x14 - El autobús de la muerte', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dw2H1DGYR3W-n7nZ6YARWcmNdBsHvvp_DfWeyA3IOHK85DxhT2DYG5WfAp-caWkT8UV8ypUM0Ue0I3BfJzQuCqkM1SObM2_M6BvJ7GcEn-ZJNW8VYsbQEijIZiHy5ssIR1Mnp8', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 14', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x13', title: '09x13 - La secta Simpson', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dxWcqioExKc7vx_ZvWCb-uIuLLOgg5KggwgtYjIGxx_WpjuQR2MDRGf_81hGv0htW2yjfeF6V5SEiRc4IqaB7J0Eu3lzl0d7n90SYmDdci5E24eO8n9M4rzpsIeDpMdEDz7tnkb', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 13', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x12', title: '09x12 - Bart en la feria', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dxFjPJm8LBigpho3T6l4mHtvYyjSHbo8C21VkFUc53mlu6Sv6MH0ANDaa96ih1Gp7zRlpfGr1XDX2tG8KHw429PLKiJlWWyw21bHvIaKLh7jh5sPZRS4DzDmDZN1EErI54IPkw', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 12', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x11', title: '09x11 - Todos cantan, todos bailan', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dwguRH40IpBGR1xa4_08z6rE5tkxzF6ipxwwGnOrYUzHFHLxNMtqiX1pEGE0N41AI6EzfhwA75XBok_j6Eis-azjRCnwc6HNFiTGhqtk6BHs2Q9s6_zvPlt-YJFdjtn_iKoNebt', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 11', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x10', title: '09x10 - Milagro en la Av. Siempreviva', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dw3Ylmr8FsSsSD-yhw2QFqR3AFvM08uAJsrfjRo01thrDelaJ9RNTefaHOYbwqIPECWXusrYISwdJfdljJDN3L1LJ2solcYQr64FeRxsFYOqiiyGF9RI4Epemq-E40E6cwWmhQ', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 10', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x09', title: '09x09 - La cruda realidad', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dwxj78oOkWgSNoq1Z7x7Gf5xardFw230CUDIzEM_22L_nPIHeeYaQNrhhsHUSzKHMobAUAhGZaxE-Mns5WNPfJbqWSLo6jJTb6B_gDg1X7iswvbswMsqqzJ93KEtOqWkjmKOUqn', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 9', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x08', title: '09x08 - La escéptica Lisa', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dzBDd1abMBBrSlDAzx8-f7GxtTVl4uuFYZG2xNI2dhiHKNxlHrtgtSxebSKyiWb0GGInRUC1zFqO4rk5cfSZB3ADA856PAo0TK7NrvHPEv-Ig_adfnYZGuMMm3alVXRFAynxss', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 8', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x07', title: '09x07 - Las dos señoras Nahasapeemapetilon', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dzVQbXTAaeDrDzB2e4NdBDHY2o1-N9wdLFNJt8jq2Jkvh8N3woTkzU4xEET3HHEHeWfBE7KEKmD63DJhaXymp741BFNOTmdw99LUOL7zIZIt56aLUclJgR4lbNAjisCWma5oQdw', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 7', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-09x06', title: '09x06 - Bart se convierte en estrella', source: 'youtube', url: 'https://www.blogger.com/video.g?token=AD6v5dwy1s5TizxNa_GyZjQv2PWndH-F4nrnCp0zvi2vM8jlfRk9oSZvtjuHT_rwN8kt2hBNR6RF9piODe1WuSvZnkt01DbI_a1hrEiXT2LCFExKQxcqlJTb3vqmtyYQlxFBQEmg5kFV', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 9 Episode 6', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x23', title: '10x23 - Treinta minutos sobre Tokio', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dxbJgYZbKd9jYTSoE-adrL_gyFnIa7MfuTszoVqTWVAAJNSv1ypX5vIw9AAkcU8fw5DeBsn8vWoXoiTJKZR2zvC0OABodQuLm93R_5YUhmUuZKQBp8Zjrr2L2w6fgknp_RCphg', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 23', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x22', title: '10x22 - Salvaron el cerebro de Lisa', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dySkxew9e-AKBc7u3jnVY-aQN5__VWmVvgv2Wl5d2LqnOHyJkKzkByKrbYjhk3bLwfkG7CWYLK-0gCZlZdV09J0ch_xQ4W-JN2YoLpNmgFmhmUWEyOay8y3tVqzNTMdGx0N_4Y', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 22', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x21', title: '10x21 - Monty no puede comprarme amor', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dw4S6rKFHC7tSdK1Yp_awifCoff9c3zyteou8e8coHg68thlWy5Ntty5yei3C5x4ojGrBAH1kcxfHwF99a_euyCCu2DFZzFmisCsB9IpLBwjV2el5w0ZOvU70qX3Gwca5P7hwGF', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 21', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x20', title: '10x20 - El anciano y el estudiante', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dxXDEgV3y2_dsQ_ZTdoQDmMGdvxLGcBDqOOqzIx5uX77VElxpV75-yZBdRGMcfE0HyCo8vijopTl-w_ZXoYBvYFI4OthtnDZx4Y8MCN2b5GsVQPkb8F9Dr5E_iVVlU1lx1qGMI', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 20', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x19', title: '10x19 - Arte de mamá y papá', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dz556IVDJOJ77Ve_dudOL7bGjhVIoPspxyANKdbEV1qokvYfdpqOVuCJ6csLZnJJ17TF4SFGJ2OE7Qjl05k7eDYrCONQ8Lz6rwpq6VymYccsunts-C5BgHuQwGfPJX55RlP92CJ', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 19', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x18', title: '10x18 - Historias de la Biblia', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dzwrKLBo-NDDXGJs1ys1_p9PSL6e0_bAr-0dHbc6Bpb2_2NeZbIM3JPNO33netO_bCRG0bizrLra_uV6HLWFlz7TIutKlTvFVa-680KH9241S8BsvleizS13nooo9qMPpyWPAE', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 18', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x17', title: '10x17 - Homero trabaja demasiado', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dymDJquG_duteALRhPEuYFylssK5VyzxfXXUI_UOEaK_dD65SrhdxrDBFDmnyKpJBH0IpwcmrqNZBl5lIJ4OHhU8ZNlQY4FR6N2rRecutdQIV2PqTZw2MBj_zQP3LhY37qhP_w', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 17', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x16', title: '10x16 - Hagan lugar para Lisa', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dyQvaUI4Kl3z_dlEL2EEKIAxz9IGAfLAr_pEK25XlmrzjxaatA4SSRn9dGSHD3abdZEera0vRkMHuMlh-CWPPydxcQOEPeoZJsjjNf-XQNXj20y1QDpe2lJ-JOIvreUMZzn6No', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 16', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x15', title: '10x15 - El submarino amarillo', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dw5WTNWIBvciPF59J2zfhTuu2f4j3XbMLMqyOPeGoNrPBV7mxZkdWqzsANQVnxBQaTvY5tIXiT2CaBnXUBFSorn7AZBAApjNc53od5qo0EZqUvEbwNHCC_vDxz3Dfn9ythuDXo', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 15', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x14', title: '10x14 - Me acompaña Cupido', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dyykyIfp8P02NTEzt8Z2oFF6rmTOPuIOrEmYmlVbnvQa3aSPyiFRhyVs1eqDR9aanowGWAD-nuCvnolaxuwLrJPVvZKp6ZYRUsB3Z-EPUHwHMPdGOBJPFdIAoCZWOS3cKv4dPc', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 14', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x13', title: '10x13 - Homero al máximo', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dw29PP-iZOGb0Avgbz3D-sCx8vSrdwel1OUpIN-YK5iC1ruKtRvQbdLBcGyhuEdFXN66chHHDQ_Gytf4syR6xg6cm61VrUDTjE2ROAls-1_rXQHl0uv-_2OZZK6WNWki17NA5ZL', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 13', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x12', title: '10x12 - Domingo, Cruel domingo', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dx_F-wbQWigfU0_FwXE3V6lqKHVG07EqTaFxkWDXsWYH8c1R5OhbpaBjWDxKLMIt_4dPNhez_qAWs16e3Ev-8A6obFqxsHBNmCA45OqK_QGwBcPWTEmDcj1c3pSAGvYSA7Y39E', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 12', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x11', title: '10x11 - A un Bart salvaje', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dxkWjrUFQCtABz5c39F3nBF-fCBxTJhO-8dYu-tTj9im485rSy-69Q_Bvf2gxEyYpn8LJAnwiuJ-r_kv2aMkkLZDvkFZf5_F5LeMJfdSg2MM1E0rJzOpjWUIo5nxO7sZv1TXJg', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 11', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x10', title: '10x10 - Viva Ned Flanders', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dwmu_Oiiy3_138cKy2dMAQkXoBN6ULRLG-HP4TqtHTpOkvbAKDTwos9mq9D254e2zfjgnK2MkTlSMEz561H0xIdi4eWOnVLBGeXS7JDZRjeEFB9LszTDGje6bYXL-yo-6hAt3g', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 10', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x09', title: '10x09 - Encuentro con la mafia', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dzpQ-UP9e988eJsBgBzgBy82oBrxvPOQFpkPEsr_qYHqJ2ifWnXlH6rViixj6Fl_LiDsKuZw-Y0C-YfWgMTMYnbbiYLh-nX1WoFPk4zk-cXemoWC0GMiG1M3T7_CDlsj1m63Lcg', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 9', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x08', title: '10x08 - Homero Simpson en Pr. renales', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dxhss9xRVJ15JAup06iTw2cRFiVh32phOPEfcvxPanQr8oNp5gRaYMNL21aIzrJIbVovp5IAbKr4ZOehmyWlzT2D6sAQTIn4jBNXSybWxr7z0uUj1rRxjNdeB_0rsPlGWyKnayI', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 8', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x07', title: '10x07 - Lisa obtiene un 10', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dzX36d9T7xsVH1U_qxSChMqKM-c_FAhXJ0B-E21YQ5ltbybOOTnv5V3RKHy430EjN2IRZG2Cr1kXEym5k4Ti2qFyYBff1CqtLpr6QFyd4gAp45WshYmzdOiOrhAHYGu0ww6pFKj', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 7', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x06', title: '10x06 - Ough en el viento', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dxSOOSNApxnijJqbzfRRSmicKqpAWBj8WH3gUO-rB-TUVQMx6Fds-l90uGZAa3quIP3FWGvKBJRZYMTceEhQo0J8rAbfTrVy-PJ5JDlV2-Z_zcFvw9nP1Q48YVegWwqFRna4AQ', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 6', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x05', title: '10x05 - Cuando se anhela a una estrella', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dzniyOmjOwO6cHSw-knmVKwaWD_1BTXhq6LV7F4Vu6DQibw7xO0MsnwLFugf1vY9Vs3p1AnYRARfZ9WTxhWqfA5qxDygHpdT_xHCSg1225V_mmRrMgAa-lWrOuGXcKBBiOTBn8g', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 5', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-10x04', title: '10x04 - El árbol del Horror 9', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dw7BTZm8Hv3GzW1q1w3MzNHKxdn6_w-fjdTLx3nAIs7_ZGeCY11_cajyGM_r5W_htlZAHc_bDqbRA01iHiOfsnD47U-ZcdpxcYnWxivXjKXYhTtTMCrcIViJX9B0nfsEqor75EY', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 10 Episode 4', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x22', title: '11x22 - Detrás de la Risa', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dw6gfRyMw7YltagLuwS26QswYaAgIPbCZYMJpgSIIDIVuCXbIYiKU5alYYe-hJ4AAS9nS7d8J9pFrqYQygMqP3mzNzBKEGnC9YhoPNZ-TUy7UJ8eeNsVBnt6-qzOsUkvS7hYDjG', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 22', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x21', title: '11x21 - Marge está loca...', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dzNVK8xyDM-ozoffsWdEVpbTzEVQpnNgkRVTiFsQP9lHiNUMwprX40Wwy7_WsT9kraCkCQPsCrO6U6GWGuV1YOil4y2V8NENETaISn3tbk26tezsyt4L0huWQ3J0McGJSW0DXQ', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 21', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x20', title: '11x20 - El Último Tango...', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dzrPObbf3cjYgmX-e3InrQSWwLrbj7lCzM6JW7XPUkmozkQlBCsmS9pivCanxpGC12bvqV6SQRkvyg57sA0njBn5XeCvceaoWRunAWHH3uwUr1imQ6VyQdTfwydQuuGTV9ju-M', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 20', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x19', title: '11x19 - Mata al cocodrilo...', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dxJN0Jb5V8NZAd65ipsGibdpdpoiAGS4nPFjTLeZHWkwOSlnqcY2zE4_t6yNwWagsFYaqBeOINuFGtmLv4A7eYwB_2IwgXaKj2OaufPt38styYBajhE9S6a8ahAj_s6TAC3SWGe', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 19', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x18', title: '11x18 - Días de Vino y Rosas', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dwCNiPkJSVj4caUkCUiW0Sn0dkYI6DeP1HVBbOj1lYguymRkAWf5QSmCZRWfn9MZhfhzh2JuQoav97V1L0dCEwaBdOU_KNY98CEVGIMY6mwBn0joCz2eoXTPiQnzcIebFs0j9nJ', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 18', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x17', title: '11x17 - Bart al Futuro', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dxwfHAxqBfBsZKdtgK-u8ZKs6l3xuVdi9oyMcDj18GHhUD_mCRjpZ2_wcjrPZNKL7p5baiugbZ7BApGNxpBWZ0CaPNHmIPtcNJSdHFgfqstmb7pdprW5T1sgE7nNQEN3-G8MkA', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 17', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x16', title: '11x16 - Pigmoelion', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dy0TmwpDZx4WHRnAPEPzGDUmvB4kOE2iPsZvN_t5wCnNE5a7ITdXv-wrYYjJNxunMcuBFg6omE00z_pzXLSg3GgFdf4-z7o1rYr5UY9-S7twMve3lJ4hjjAjhBd-I8yEEDcNw', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 16', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x15', title: '11x15 - Misionero Imposible', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dztJi3OY0D_vvdEmtZjoCUZqzzZkGypT-J8wo1jIUDcQ3VdEsZ-vLP1uZo22P9DhE42r_xCHX9GrqDpzCANw7eTeZI_7FjthzkgILe0G0v8bDwpIMmrvNCyEBYrw6nXWH7Iq38', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 15', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x14', title: '11x14 - Solo Nuevamentirijillo', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dw0BytLbeqnmUuZjy-EJsMp2RC0tgfWPm3i1Ok1BY9pyO6y-jGtSAOtJQ8mzMjSNVxMj5Fcwci5kE383_LtiulRsmAsRSQz0RISUS598B3U96fJQ3kzttQQ8ARzNpALB_78tSVA', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 14', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x13', title: '11x13 - Jinetes Galácticos', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dy1mz6QJL6Y4hoEpx1NB5-MFZduvHMEGqeg10X1elTBrYPObcVZTM6Y7CUpXP9zfemoVnLQD26Xqu9hWeJSkbGPcovGIqTQvCz_T6E-IATDNuqU2Tm2IvPf1WTnNRr5kyBeC7Ws', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 13', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x12', title: '11x12 - La Familia Mansión', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dy6wYSTT0oVah2qcno4VHcHZLMu3DQpMODiOFtKN07nTuoE_0kU6SnMYt-aw1n70-rg3vYAT3xTQK_GRL8DryeLuGIM-QLmAuSXRm7Uamn4OQM6892D2r0PGeCzzJ13_ApS5msq', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 12', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x11', title: '11x11 - Pérdida de Fe', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dxkprBku79AMVFKytsfq5iPSeXuwew3m-3hVpnZkYr_cB1Vi3YTID4O0Hk9uNX_T-EQH94U5LL2bWx1naEQ8jmjWnsZSU-g9tfwNk5WmN4nU2tfVSp5EH-nlHredb5Vlroaf6Y', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 11', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x10', title: '11x10 - La Pequeña Mamá', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dy7DZAcfQEy5jMUtP8etnvHmAovEqBW6Cn11UsbRaxHUKyRACvw6pRwR9k6jWDfqjtQJSmggJmX0r8xh9dUerBUIJut0abXG9evajoLV4BLOMpdouu7BfuwJBJwvf7yfDlZpr7_', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 10', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x09', title: '11x09 - Un Gran Embaucador', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dxZVJLZ8sLrOvA6KA90oBrdlFrd9P9SPp1agZ7oaFO3nkCeTu5NRLyhkdgf5GCKaemf0W_pcAemK-xbDfYTpO6Eswi9IfHGYwqU3X1iMjVCFw7WJpKnAPSz32GrHWplVpQG6LCu', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 9', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x08', title: '11x08 - Llévate a mi esposa', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dxUEG7EAPC-Q85MTeiE960VjuW50EXWaITfzu4in715fxG_8w_-RzJBw7Ib61bmJrqeHr9oMGbvhVcwc2rsbHWYltopoCT8isbcunSdxc46YyxSU-AVvSRVI1S7ATy7-Axr3Q', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 8', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x07', title: '11x07 - Mal Comportamiento', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dwyVzAY948wFE6WqSlsAdYbAiszvFgqRMhg2o31gBCy5uT1CSnZXO8uLqicU62sTFmVa5girenNPLrDBddW_oi-XsQqjS_fo-7I0ldetLFdtJCyDH5xUf9gKfyvVECfCTv3FWs9', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 7', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x06', title: '11x06 - Hola Mamá, Hola Papá', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dxPLmBg5-IdxxXMZM_v9630XvNtluD92asTDFIKZ7_Qaj3m456QdLCM7i_3Ncz7J3G9fO8jrqCs7-1Fb-O2nH6EjTT5WuGr83J58vy5jAfaoG35i7y6Oe2fy-P0--6nXHmjzmWw', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 6', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x05', title: '11x05 - Homero Granjero', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dz9o5DLPzutfBF0ZqbCJOOyMC-Ld5ijy0GYh68fUJy1hfcx0VYba5NUbpXOhQgszD5fzLSdvfdpd-SHQoCYmNQkAKoXYVrVuAiS_dqZEWdN_CwV4THcoecjl8vTyT2gPgeKaGY', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 5', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x04', title: '11x04 - Especial de Brujas 10', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dz8-KnRe7iE9B9LYDcvjGVJpNSSpq91iPbGe-oOi_9rNsijkZ4hD-2ApSf0iIqwqHAnjEqIhXVXhbk4WxWC4QXTIA76S8JXrtCcOV6DJRoadOBwdMcX5oVetjhSi2sS0JGoOA', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 4', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-11x03', title: '11x03 - Adivina quién viene...', source: 'youtube', url: 'https://draft.blogger.com/video.g?token=AD6v5dw3h3p3Kp_62mHwJlrkLLiE2xuDECkVJrhFsoGydcadrb1PRMfoU41t9I54j66maZVvZqiS-6JvL13rCkmC_8dcZNMX83VbAM5Mvqma7CTWScy4WGCZmGFyjgaIPa7F-FfaIqs', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 11 Episode 3', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-32x09', title: '32x09 - Los Simpsons Temporada 32', source: 'mega', url: 'https://mega.nz/embed/uY4wVJ5Y#vnRIXR_x336Q2Z9xoj-6Uv7d14btsEeFh8tyu_YJft0', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 32 Episode 9', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-32x08', title: '32x08 - Los Simpsons Temporada 32', source: 'mega', url: 'https://mega.nz/embed/GZYzjIyB#3-iJlMpjFohlaijrXf855yKB7hc0k6RjPZGtRCSs_B4', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 32 Episode 8', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-32x07', title: '32x07 - Los Simpsons Temporada 32', source: 'mega', url: 'https://mega.nz/embed/GVBjDI7K#fD45QINo3GOa3EHwt2oUwpXxz7yrIk1gfDDkCSsAlaQ', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 32 Episode 7', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-32x06', title: '32x06 - Los Simpsons Temporada 32', source: 'mega', url: 'https://mega.nz/embed/zJBFjTzb#W_Z70jW4_iV6bW-xy_HdxCQrnwyUb4KHrSjghQJIhTk', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 32 Episode 6', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-32x05', title: '32x05 - Los Simpsons Temporada 32', source: 'mega', url: 'https://mega.nz/embed/PJoxQJQZ#yd8XarUm4He1UDegMtbZRcUuUmXqc2b8iIlvt9nC6ts', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 32 Episode 5', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-32x04', title: '32x04 - Los Simpsons Temporada 32', source: 'mega', url: 'https://mega.nz/embed/jBYjQCDJ#K6nzud6-ZbAYTA4kCf-1Cllf56VvseOuSOxk_MZYbo8', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 32 Episode 4', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-32x03', title: '32x03 - Los Simpsons Temporada 32', source: 'mega', url: 'https://mega.nz/embed/vZRnxBzR#-l6mrVzH-bOXC86EiN57qSXBdUUzmB06yi8d56TO6Eo', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 32 Episode 3', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-32x02', title: '32x02 - Los Simpsons Temporada 32', source: 'mega', url: 'https://mega.nz/embed/zBwFAZLA#0nXjbGnpV6EQcfhD1ydbbopKy8GtuBn6T-YL0LP9pqU', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 32 Episode 2', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
  { id: 'simpsons-32x01', title: '32x01 - Los Simpsons Temporada 32', source: 'mega', url: 'https://mega.nz/embed/aB4WySJb#1e6DeK6quA2ETrw4TggPn-VEtCjvlphDEYpotY24naU', thumbnail: 'https://es.web.img3.acsta.net/pictures/19/08/12/10/01/2179246.jpg', description: 'Los Simpsons Temporada 32 Episode 1', category: 'entretenimiento', tags: [], author: 'Fox', duration: '22 min' },
];

const CATEGORY_QUERIES: Record<string, string[]> = {
  documental: ['documental completo', 'documentary', 'history documentary'],
  ciencia: ['ciencia explicada', 'science documentary', 'physics universe'],
  pelicula: ['pelicula completa', 'short film', 'cortometraje'],
  opera: ['opera completa', 'classical music concert', 'symphony orchestra'],
  podcast: ['entrevista completa', 'videopodcast', 'charla'], 
  tutorial: ['tutorial completo', 'curso gratis', 'masterclass'],
  conferencia: ['conference talk', 'conferencia', 'presentacion'],
  concepto: ['full concert HD', 'concierto en vivo', 'live concert full', 'classical concert'],
  arte: ['arte documental', 'art history', 'museum tour'],
  cortometraje: ['cortometraje festival de cine', 'award winning short film', 'cortometraje internacional arte', 'cannes short film'],
  entretenimiento: ['los simpsons capitulo completo', 'the simpsons full episode', 'simpsons serie completa'],
  concierto: ['concierto completo', 'live concert', 'concierto en vivo', 'classical music concert', 'symphony orchestra'],
};

const ALIASES: Record<string, string[]> = {
  'ia': ['inteligencia artificial', 'artificial intelligence', 'ia', 'ai'],
  'ai': ['artificial intelligence', 'inteligencia artificial', 'ai', 'ia'],
  'ux': ['user experience', 'experiencia de usuario', 'ux'],
  'ui': ['user interface', 'interfaz de usuario', 'ui'],
  '3d': ['tres dimensiones', '3d modeling', '3d'],
};

const normalizeText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function detectCategory(title: string, description: string): MediaCategory {
  const text = normalizeText(`${title} ${description}`);
  if (text.includes('corto') || text.includes('short film') || text.includes('cortometraje')) return 'cortometraje';
  if (text.includes('documental') || text.includes('documentary') || text.includes('historia')) return 'documental';
  if (text.includes('ciencia') || text.includes('science') || text.includes('fisica')) return 'ciencia';
  if (text.includes('opera') || text.includes('sinfon')) return 'concierto';
  if (text.includes('podcast') || text.includes('entrevista') || text.includes('charla')) return 'podcast';
  if (text.includes('tutorial') || text.includes('how to') || text.includes('curso')) return 'tutorial';
  if (text.includes('art') || text.includes('arte') || text.includes('museo')) return 'arte';
  if (text.includes('pelicula') || text.includes('movie') || text.includes('film')) return 'pelicula';
  if (text.includes('simpson') || text.includes('entretenimiento')) return 'entretenimiento';
  return 'documental';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const category = (searchParams.get('category') as CategoryFilter) || 'all';
    const page = parseInt(searchParams.get('pageToken') || '0', 10);
    
    const cacheKey = `${query}-${category}`.toLowerCase();
    let allVideos: UnifiedMedia[] = [];

    if (searchCache.has(cacheKey) && (Date.now() - searchCache.get(cacheKey)!.timestamp < CACHE_DURATION)) {
      allVideos = searchCache.get(cacheKey)!.data;
    } else if (category === 'entretenimiento') {
      console.log('🕵️ Mezclando Blogger y YouTube Extendido para Entretenimiento...');
      
      let youtubeVideos: any[] = [];
      
      if (query === '') {
        // Matriz de Búsqueda Masiva para Entretenimiento
        const entertainmentQueries = [
          'capítulos completos los simpsons latino',
          'capítulos completos futurama latino',
          'capítulos completos padre de familia latino',
          'capítulos completos daria latino',
          'capítulos completos south park latino',
          'capítulos completos la casa de los dibujos latino',
          'capítulos completos malcolm el de en medio latino',
          'capítulos completos rick and morty latino'
        ];
        
        console.log(`🚀 Lanzando ${entertainmentQueries.length} hilos de búsqueda para Entretenimiento...`);
        const searchPromises = entertainmentQueries.map(q => 
          YouTube.search(q, { limit: 30, type: "video" }).catch(() => [])
        );
        
        const resultsMatrix = await Promise.all(searchPromises);
        const rawResults = resultsMatrix.flat();
        
        const uniqueMap = new Map();
        rawResults.forEach((v: { id?: string }) => {
          if (v.id && !uniqueMap.has(v.id)) uniqueMap.set(v.id, v);
        });
        
        youtubeVideos = Array.from(uniqueMap.values());
        
        // Filtro Anti-Reacciones y Lista Negra de Canales
        youtubeVideos = youtubeVideos.filter((v: any) => {
          const channelName = (v.channel?.name || '').toLowerCase();
          const title = (v.title || '').toLowerCase();
          
          // Palabras bloqueadas en títulos o nombres de canal
          const blockedKeywords = ['reaccion', 'reacción'];
          // Lista negra de canales específicos (en minúsculas)
          const blockedChannels = ['reichanneltvv', 'loren reacciona', 'luigi primetv', 'some lopez', 'kira', 'kiradad', 'maria perez'];
          
          const hasBlockedKeyword = blockedKeywords.some(keyword => 
            channelName.includes(keyword) || title.includes(keyword)
          );
          
          const isBlockedChannel = blockedChannels.some(channel => 
            channelName.includes(channel)
          );

          return !hasBlockedKeyword && !isBlockedChannel;
        });
      } else {
        // Búsqueda específica del usuario dentro de entretenimiento
        const searchPromises = [
          YouTube.search(query, { limit: 40, type: "video" }).catch(() => []),
          YouTube.search(`${query} latino`, { limit: 40, type: "video" }).catch(() => []),
        ];
        const resultsMatrix = await Promise.all(searchPromises);
        const rawResults = resultsMatrix.flat();
        
        const uniqueMap = new Map();
        rawResults.forEach((v: { id?: string }) => {
          if (v.id && !uniqueMap.has(v.id)) uniqueMap.set(v.id, v);
        });
        youtubeVideos = Array.from(uniqueMap.values());
        
        // Filtro Anti-Reacciones y Lista Negra de Canales
        youtubeVideos = youtubeVideos.filter((v: any) => {
          const channelName = (v.channel?.name || '').toLowerCase();
          const title = (v.title || '').toLowerCase();
          
          // Palabras bloqueadas en títulos o nombres de canal
          const blockedKeywords = ['reaccion', 'reacción'];
          // Lista negra de canales específicos (en minúsculas)
          const blockedChannels = ['reichanneltvv', 'loren reacciona', 'luigi primetv', 'some lopez', 'kira', 'kiradad', 'maria perez'];
          
          const hasBlockedKeyword = blockedKeywords.some(keyword => 
            channelName.includes(keyword) || title.includes(keyword)
          );
          
          const isBlockedChannel = blockedChannels.some(channel => 
            channelName.includes(channel)
          );

          return !hasBlockedKeyword && !isBlockedChannel;
        });
      }
      
      // Mapear al formato unificado de VIDEOSCHOOL
      youtubeVideos = youtubeVideos.map((v: any) => ({
        id: v.id || '',
        title: v.title || '',
        source: 'youtube' as const,
        url: v.id ? `https://www.youtube.com/watch?v=${v.id}` : '',
        thumbnail: v.thumbnail?.url || (v.id ? `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` : ''),
        description: v.description || `Video de ${v.channel?.name || 'YouTube'}`,
        duration: v.durationFormatted || '',
        author: v.channel?.name || 'Desconocido',
        category: 'entretenimiento',
        tags: [],
        createdAt: new Date(),
        publishedAt: new Date().toISOString(),
        durationSeconds: 0,
      }));
      
      allVideos = query === '' ? [...SIMPSONS_EPISODES, ...youtubeVideos] : youtubeVideos;
      
      searchCache.set(cacheKey, { timestamp: Date.now(), data: allVideos });
      console.log(`💾 Guardado Entretenimiento Híbrido Expandido: ${allVideos.length} videos totales`);
    } else {
      console.log('🕵️ Iniciando Deep Matrix Scraping para:', cacheKey);

      // 2. TRADUCCIÓN DE ACRÓNIMOS PARA YOUTUBE
      const normQuery = query.toLowerCase();
      const queryForYoutube = ALIASES[normQuery] ? ALIASES[normQuery][0] : query;

      let baseStrings: string[] = [];
      if (query === '') {
        baseStrings = category === 'all' ? ['documentales educativos', 'ciencia explicada', 'cursos gratis'] : CATEGORY_QUERIES[category];
      } else {
        if (category === 'all') {
          baseStrings = [queryForYoutube, `${queryForYoutube} documental`, `${queryForYoutube} explicado`];
        } else {
          baseStrings = CATEGORY_QUERIES[category].map(catKw => `${queryForYoutube} ${catKw}`);
        }
      }

      // 3. MATRIZ DE VIAJE EN EL TIEMPO (El multiplicador masivo)
      // Añadimos sufijos para romper la "Burbuja del Top 20" de YouTube
      const modifiers = ['', '2026', '2025', 'nuevo']; 
      
      // Multiplicamos las 3 búsquedas base por los 4 modificadores = 12 Hilos de búsqueda
      const searchStrings = baseStrings.flatMap(base => 
        modifiers.map(mod => mod ? `${base} ${mod}` : base)
      );

      console.log(`🚀 Lanzando ${searchStrings.length} hilos de búsqueda para máxima cobertura...`);

      // 3.5 EXTRACCIÓN MASIVA 
      // Usamos limit: 30 por hilo. 12 hilos * 30 = 360 videos crudos solicitados.
      const searchPromises = searchStrings.map(searchStr => 
        YouTube.search(searchStr, { limit: 30, type: "video" }).catch(() => [])
      );
      
      const resultsMatrix = await Promise.all(searchPromises);
      const rawResults = resultsMatrix.flat();

      const uniqueMap = new Map();
      const stopWords = new Set(['de', 'el', 'la', 'en', 'un', 'una', 'los', 'las', 'por', 'con', 'para', 'del', 'que', 'se', 'su', 'al', 'y', 'o', 'a', 'to', 'of', 'in', 'and', 'for', 'the']);
      
      const baseKeywords = normQuery.split(' ').filter(word => word.length >= 2 && !stopWords.has(word));
      const keywords = baseKeywords.flatMap(kw => ALIASES[kw] ? ALIASES[kw] : [kw]).map(normalizeText);

      rawResults.forEach((v: { id?: string }) => {
        if (v.id && !uniqueMap.has(v.id)) uniqueMap.set(v.id, v);
      });

      let filteredRaw = Array.from(uniqueMap.values());

      if (keywords.length > 0 && query !== 'documentales' && query !== '') {
        const strictFiltered = filteredRaw.filter((v: { title?: string; description?: string; channel?: { name?: string } }) => {
          const textToSearch = normalizeText(`${v.title} ${v.description || ''} ${v.channel?.name || ''}`);
          return keywords.some(kw => {
            if (kw.includes(' ')) return textToSearch.includes(kw);
            const safeKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${safeKw}\\b`, 'i');
            return regex.test(textToSearch);
          });
        });

        if (strictFiltered.length >= 40) {
          filteredRaw = strictFiltered;
        } else {
          console.log(`⚠️ Filtro muy estricto (${strictFiltered.length} res). Activando Safe Fallback.`);
        }
      }

      allVideos = filteredRaw.map((v: { id?: string; title?: string; description?: string; thumbnail?: { url?: string }; channel?: { name?: string }; durationFormatted?: string }) => ({
        id: v.id || '',
        title: v.title || '',
        source: 'youtube' as const,
        url: v.id ? `https://www.youtube.com/watch?v=${v.id}` : '',
        thumbnail: v.thumbnail?.url || (v.id ? `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` : ''),
        description: v.description || `Video de ${v.channel?.name || 'YouTube'}`,
        duration: v.durationFormatted || '',
        author: v.channel?.name || 'Desconocido',
        category: category !== 'all' ? category : detectCategory(v.title || '', v.description || ''),
        tags: [],
        createdAt: new Date(),
        publishedAt: new Date().toISOString(),
        durationSeconds: 0,
      }));
      
      searchCache.set(cacheKey, { timestamp: Date.now(), data: allVideos });
      console.log(`💾 Guardado MATRIX: ${cacheKey} (${allVideos.length} videos finales)`);
    }

    // Filtrado por duración
    const durationFilter = searchParams.get('duration');
    if (durationFilter && durationFilter !== 'any') {
      allVideos = allVideos.filter(v => {
        if (!v.duration) return false;
        
        const parts = v.duration.split(':').map(Number);
        let minutes = 0;
        if (parts.length === 3) {
          minutes = (parts[0] * 60) + parts[1];
        } else if (parts.length === 2) {
          minutes = parts[0];
        } else {
          minutes = 0;
        }

        if (durationFilter === '20-35') return minutes >= 20 && minutes <= 35;
        if (durationFilter === '36-60') return minutes >= 36 && minutes <= 60;
        if (durationFilter === '>60') return minutes > 60;
        return true;
      });
    }

    const PAGE_SIZE = 12;
    const startIndex = page * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const paginatedVideos = allVideos.slice(startIndex, endIndex);
    const hasMore = endIndex < allVideos.length;

    return NextResponse.json({
      media: paginatedVideos,
      total: allVideos.length,
      hasMore,
      nextPageToken: hasMore ? (page + 1).toString() : null,
    });
    
  } catch (error) {
    console.error('Error en el Motor Matrix:', error);
    return NextResponse.json({ error: 'Error al buscar videos.', media: [], hasMore: false, nextPageToken: null }, { status: 500 });
  }
}
