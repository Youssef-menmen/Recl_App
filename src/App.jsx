import { complaintApi } from './api';
import React, { useState, useCallback, useEffect } from "react";
import emailjs from "@emailjs/browser";

/* ─────────────────────────────────────────────
   EMAILJS CONFIG
───────────────────────────────────────────── */
const EMAILJS_SERVICE_ID  = "service_irm68pa";
const EMAILJS_TEMPLATE_ID = "template_gp083i6";
const EMAILJS_PUBLIC_KEY  = "_m8UB7euuQ5hac2Tl";

/* ─────────────────────────────────────────────
   DONNÉES
───────────────────────────────────────────── */
const PLATFORMS = [
  { id: "coursera",       name: "Coursera",       color: "#0056D2", accent: "#00B8FF", logo: "C"  },
  { id: "crossknowledge", name: "CrossKnowledge", color: "#E63946", accent: "#FF6B6B", logo: "CK" },
  { id: "oracle",         name: "Oracle MyLearn", color: "#C74634", accent: "#FF8C42", logo: "O"  },
];

const CATEGORIES = {
  coursera:       ["Accès au cours / Connexion","Certificat non reçu","Problème de vidéo ou contenu","Paiement ou abonnement","Quiz ou évaluation","Progression non sauvegardée","Autre"],
  crossknowledge: ["Connexion à la plateforme","Module inaccessible","Résultats non enregistrés","Interface ou navigation","Problème de parcours","Support responsive","Autre"],
  oracle:         ["Activation du compte","Accès à la formation","Certification Oracle","Examen ou test pratique","Contenu technique erroné","Problème de lab virtuel","Autre"],
};

const PRIORITIES = [
  { value: "low",    label: "Faible"  },
  { value: "medium", label: "Moyenne" },
  { value: "high",   label: "Urgente" },
];

const STATUSES = ["En attente", "En cours", "Validé", "Annulé"];

const STATUS_COLORS = {
  "En attente": "#FF9800",
  "En cours":   "#2196F3",
  "Validé":     "#4CAF50",
  "Annulé":     "#9E9E9E",
};

const ADMIN_CREDS = { login: "admin", password: "admin123" };

const FORM_INIT = {
  firstName: "", lastName: "", studentId: "", email: "",
  category: "", priority: "medium", subject: "", description: "",
};

const INIT_COMPLAINTS = [
  { id:"REC-2024-001", platform:"Coursera",       category:"Certificat non reçu",       status:"En cours",   date:"2024-11-28", priority:"high",   subject:"Certificat Python non délivré après validation",  firstName:"Amina",   lastName:"Belkadi", studentId:"ETU-2024-0042", email:"amina.belkadi@uni.ma", description:"J'ai terminé le cours Python for Everybody il y a 2 semaines mais je n'ai toujours pas reçu mon certificat." },
  { id:"REC-2024-002", platform:"Oracle MyLearn", category:"Accès à la formation",      status:"Validé",     date:"2024-11-20", priority:"medium", subject:"Impossible d'accéder au cours Java Advanced",      firstName:"Youssef", lastName:"Ouali",   studentId:"ETU-2024-0018", email:"y.ouali@uni.ma",       description:"Le lien vers le cours Java Advanced me renvoie une erreur 403." },
  { id:"REC-2024-003", platform:"CrossKnowledge", category:"Résultats non enregistrés", status:"En attente", date:"2024-12-01", priority:"medium", subject:"Score du module Management non sauvegardé",        firstName:"Sara",    lastName:"Amine",   studentId:"ETU-2024-0031", email:"s.amine@uni.ma",       description:"Après avoir terminé le module Management, mon score n'apparaît pas dans mon tableau de bord." },
  { id:"REC-2024-004", platform:"Coursera",       category:"Quiz ou évaluation",        status:"En attente", date:"2024-12-03", priority:"low",    subject:"Quiz bloqué à 80%",                               firstName:"Karim",   lastName:"Nassir",  studentId:"ETU-2024-0055", email:"k.nassir@uni.ma",       description:"Le quiz du module 4 se bloque toujours à 80% et ne valide pas ma réponse finale." },
];

/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #0A0A0F; color: #E8E8F0; min-height: 100vh; }

  .nav { position: sticky; top: 0; z-index: 100; width: 100%; background: rgba(10,10,15,0.92); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; height: 62px; }
  .nav-inner { width: 100%; max-width: 1100px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; }
  .brand { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; background: linear-gradient(135deg, #A78BFA, #60A5FA); -webkit-background-clip: text; -webkit-text-fill-color: transparent; cursor: pointer; }
  .nav-links { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
  .nbtn { padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; background: transparent; color: #A0A0B8; transition: all .2s; font-family: 'DM Sans', sans-serif; }
  .nbtn:hover { background: rgba(255,255,255,0.07); color: #E8E8F0; }
  .nbtn.act { background: rgba(167,139,250,0.15); color: #A78BFA; }
  .nbtn.adm { background: rgba(255,152,0,0.12); color: #FF9800; border: 1px solid rgba(255,152,0,0.25); }
  .nbtn.adm:hover { background: rgba(255,152,0,0.22); }
  .nbtn.adm-act { background: rgba(255,152,0,0.25); color: #FFAB40; border: 1px solid rgba(255,152,0,0.4); }
  .nbtn.student-btn { background: rgba(96,165,250,0.12); color: #60A5FA; border: 1px solid rgba(96,165,250,0.25); }
  .nbtn.student-btn:hover { background: rgba(96,165,250,0.22); }
  .pw { width: 100%; max-width: 1100px; margin: 0 auto; padding: 0 24px; display: flex; flex-direction: column; align-items: center; }

  /* AUTH */
  .auth-wrap { display: flex; align-items: center; justify-content: center; min-height: 80vh; width: 100%; }
  .auth-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 20px; padding: 48px 44px; width: 100%; max-width: 440px; }
  .auth-icon { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 24px; }
  .auth-icon.student { background: rgba(96,165,250,0.15); border: 1px solid rgba(96,165,250,0.3); }
  .auth-icon.admin   { background: rgba(255,152,0,0.15);  border: 1px solid rgba(255,152,0,0.3); }
  .auth-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; margin-bottom: 6px; }
  .auth-sub   { font-size: 13px; color: #6060A0; margin-bottom: 28px; line-height: 1.6; }
  .finput { width: 100%; padding: 12px 14px; background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.09); border-radius: 10px; color: #E8E8F0; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; margin-bottom: 14px; transition: all .2s; }
  .finput:focus { border-color: #60A5FA; background: rgba(96,165,250,0.06); }
  .finput.err { border-color: #F44336; }
  .finput.admin-focus:focus { border-color: #FF9800; background: rgba(255,152,0,0.06); }

  /* OTP */
  .otp-wrap { display: flex; gap: 10px; margin-bottom: 20px; justify-content: center; }
  .otp-input { width: 48px; height: 56px; text-align: center; font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 12px; color: #E8E8F0; outline: none; transition: all .2s; }
  .otp-input:focus { border-color: #A78BFA; background: rgba(167,139,250,0.1); }
  .otp-input.filled { border-color: rgba(167,139,250,0.5); }

  /* SENDING STATE */
  .sending-box { background: rgba(96,165,250,0.08); border: 1px solid rgba(96,165,250,0.2); border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center; }
  .sending-spinner { width: 28px; height: 28px; border: 3px solid rgba(96,165,250,0.2); border-top-color: #60A5FA; border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 10px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .sending-text { font-size: 13px; color: #60A5FA; }

  /* SUCCESS SEND BOX */
  .sent-box { background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.25); border-radius: 12px; padding: 14px 16px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 10px; }
  .sent-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
  .sent-text { font-size: 13px; color: #6EE7B7; line-height: 1.5; }
  .sent-email { font-weight: 600; color: #34D399; }

  /* TIMER */
  .timer-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .timer-txt { font-size: 12px; color: #5050A0; }
  .timer-num { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; }
  .timer-num.ok  { color: #4CAF50; }
  .timer-num.warn { color: #FF9800; }
  .timer-num.exp  { color: #F44336; }

  /* BUTTONS */
  .primary-btn { width: 100%; padding: 13px; border-radius: 12px; border: none; font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #A78BFA, #60A5FA); color: white; transition: transform .2s, box-shadow .2s, opacity .2s; margin-top: 4px; }
  .primary-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(167,139,250,.3); }
  .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .student-primary { background: linear-gradient(135deg, #3B82F6, #60A5FA); }
  .student-primary:hover:not(:disabled) { box-shadow: 0 10px 28px rgba(59,130,246,.3); }
  .admin-primary { background: linear-gradient(135deg, #FF9800, #FF6F00); }
  .admin-primary:hover:not(:disabled) { box-shadow: 0 10px 28px rgba(255,152,0,.3); }
  .ghost-btn { padding: 12px 24px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,.12); background: transparent; color: #A0A0C0; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .2s; }
  .ghost-btn:hover { border-color: rgba(255,255,255,.25); color: #E8E8F0; }
  .link-btn { background: none; border: none; color: #60A5FA; font-size: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; text-decoration: underline; padding: 0; }
  .link-btn:hover { color: #93C5FD; }
  .link-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .lerr { color: #F87171; font-size: 12px; margin-bottom: 12px; text-align: center; }

  /* USER PILL */
  .user-pill { display: flex; align-items: center; gap: 8px; padding: 5px 12px 5px 6px; border-radius: 100px; background: rgba(96,165,250,0.12); border: 1px solid rgba(96,165,250,0.25); }
  .user-avatar { width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, #3B82F6, #A78BFA); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; }
  .user-email { font-size: 12px; color: #93C5FD; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* ADMIN */
  .admin-wrap { width: 100%; max-width: 1100px; padding: 40px 0; }
  .admin-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
  .admin-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; }
  .admin-badge { padding: 5px 14px; border-radius: 100px; background: rgba(255,152,0,0.15); border: 1px solid rgba(255,152,0,0.3); font-size: 12px; color: #FF9800; font-weight: 600; }
  .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 32px; }
  .stat-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 20px; text-align: center; }
  .stat-num { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800; }
  .stat-lbl { font-size: 12px; color: #5050A0; margin-top: 4px; }
  .filters { display: flex; gap: 10px; margin-bottom: 22px; flex-wrap: wrap; align-items: center; }
  .filter-sel { padding: 8px 12px; background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.09); border-radius: 10px; color: #E8E8F0; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; cursor: pointer; }
  .search-wrap { flex: 1; min-width: 180px; display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 8px 14px; }
  .search-wrap input { background: none; border: none; outline: none; color: #E8E8F0; font-family: 'DM Sans', sans-serif; font-size: 13px; width: 100%; }
  .search-wrap input::placeholder { color: #4040A0; }
  .tbl { width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.02); border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.07); }
  .tbl th { padding: 13px 16px; font-size: 11px; font-weight: 600; color: #5050A0; text-align: left; letter-spacing: .8px; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03); }
  .tbl td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
  .tbl tr:last-child td { border-bottom: none; }
  .tbl tr:hover td { background: rgba(255,255,255,0.025); }
  .plat-chip { padding: 3px 9px; border-radius: 6px; font-size: 11px; font-weight: 600; }
  .prio-dot  { width: 7px; height: 7px; border-radius: 50%; display: inline-block; margin-right: 6px; vertical-align: middle; }
  .status-sel { padding: 5px 9px; border-radius: 8px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; outline: none; font-family: 'DM Sans', sans-serif; }
  .detail-btn { padding: 5px 12px; border-radius: 8px; background: rgba(167,139,250,.12); border: 1px solid rgba(167,139,250,.25); color: #A78BFA; font-size: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .detail-btn:hover { background: rgba(167,139,250,.22); }

  /* MODAL */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .modal-card { background: #13131A; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 36px; width: 100%; max-width: 560px; max-height: 85vh; overflow-y: auto; position: relative; }
  .modal-close { position: absolute; top: 14px; right: 14px; background: rgba(255,255,255,0.07); border: none; color: #A0A0B8; font-size: 20px; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; }
  .modal-id { font-family: 'Syne', sans-serif; font-size: 11px; color: #5050A0; letter-spacing: 1px; margin-bottom: 8px; }
  .modal-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #E8E8F0; margin-bottom: 20px; line-height: 1.3; }
  .modal-row { display: flex; gap: 8px; margin-bottom: 7px; font-size: 13px; }
  .modal-key { color: #5050A0; min-width: 130px; flex-shrink: 0; }
  .modal-val { color: #C8C8E0; }
  .modal-desc { margin-top: 18px; padding: 14px; background: rgba(255,255,255,0.04); border-radius: 10px; font-size: 13px; color: #B0B0D0; line-height: 1.65; }
  .modal-desc p { font-size: 11px; color: #5050A0; margin-bottom: 8px; }

  /* HOME */
  .hero { padding: 80px 0 50px; width: 100%; text-align: center; }
  .hero-badge { display: inline-flex; align-items: center; gap: 8px; padding: 5px 16px; border-radius: 100px; background: rgba(167,139,250,0.12); border: 1px solid rgba(167,139,250,0.25); font-size: 12px; font-weight: 500; color: #A78BFA; margin-bottom: 24px; }
  .hero h1 { font-family: 'Syne', sans-serif; font-size: clamp(34px,6vw,62px); font-weight: 800; line-height: 1.05; letter-spacing: -2px; margin-bottom: 16px; }
  .hero h1 span { background: linear-gradient(135deg, #A78BFA 0%, #60A5FA 50%, #34D399 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .hero-sub { font-size: 17px; color: #7070A0; line-height: 1.7; max-width: 520px; margin: 0 auto 44px; }
  .pgrid { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; max-width: 860px; margin: 0 auto; }
  .pcard { position: relative; overflow: hidden; border-radius: 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); padding: 32px 24px; cursor: pointer; transition: transform .3s cubic-bezier(.34,1.56,.64,1), border-color .3s, background .3s; text-align: center; }
  .pcard:hover { transform: translateY(-6px); border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); }
  .pcard::before { content:''; position: absolute; top:0; left:0; right:0; height:2px; background:var(--ac); opacity:0; transition:opacity .3s; }
  .pcard:hover::before { opacity:1; }
  .plogo  { width:58px; height:58px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:18px; font-weight:800; color:white; margin:0 auto 18px; }
  .pname  { font-family:'Syne',sans-serif; font-size:17px; font-weight:700; margin-bottom:8px; color:#E8E8F0; }
  .pdesc  { font-size:12px; color:#6060A0; line-height:1.5; }
  .parrow { margin-top:20px; display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; color:var(--ac); opacity:0; transform:translateY(6px); transition:all .3s; }
  .pcard:hover .parrow { opacity:1; transform:translateY(0); }
  .srow { display:flex; gap:1px; max-width:860px; margin:50px auto 0; background:rgba(255,255,255,0.06); border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,0.06); }
  .si   { flex:1; padding:22px; background:rgba(10,10,15,.95); text-align:center; }
  .sn   { font-family:'Syne',sans-serif; font-size:28px; font-weight:800; background:linear-gradient(135deg,#A78BFA,#60A5FA); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .slbl { font-size:12px; color:#5050A0; margin-top:3px; }

  /* FORM */
  .fwrap { width:100%; max-width:680px; padding:36px 0; }
  .back-btn { display:inline-flex; align-items:center; gap:7px; background:none; border:none; color:#7070A0; font-family:'DM Sans',sans-serif; font-size:13px; cursor:pointer; padding:0; margin-bottom:24px; transition:color .2s; }
  .back-btn:hover { color:#E8E8F0; }
  .stepper { display:flex; align-items:center; margin-bottom:36px; }
  .s-circle { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:13px; font-weight:700; flex-shrink:0; transition:all .3s; }
  .s-circle.done   { background:#A78BFA; color:white; border:none; }
  .s-circle.active { background:rgba(167,139,250,.18); color:#A78BFA; border:2px solid #A78BFA; }
  .s-circle.todo   { background:rgba(255,255,255,.05); color:#404070; border:2px solid rgba(255,255,255,.1); }
  .s-label { font-size:11px; color:#5050A0; white-space:nowrap; margin-left:8px; }
  .s-label.active { color:#A78BFA; font-weight:500; }
  .s-line { flex:1; height:1px; background:rgba(255,255,255,.08); margin:0 8px; }
  .s-line.done { background:#A78BFA; }
  .psel { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:28px; }
  .po { padding:18px 12px; border-radius:12px; border:2px solid rgba(255,255,255,.07); cursor:pointer; text-align:center; transition:border-color .2s,background .2s; background:rgba(255,255,255,.02); }
  .po:hover { border-color:rgba(255,255,255,.2); }
  .po.sel { border-color:var(--ac); background:rgba(167,139,250,.08); }
  .pol { width:40px; height:40px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:13px; font-weight:800; color:white; margin:0 auto 8px; }
  .pon { font-size:11px; font-weight:500; color:#909090; }
  .po.sel .pon { color:#E8E8F0; }
  .frow { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .ff { display:flex; flex-direction:column; margin-bottom:18px; }
  .flbl { font-size:12px; font-weight:500; color:#8080B0; margin-bottom:7px; letter-spacing:.3px; }
  .fi,.fsel,.fta { width:100%; padding:11px 14px; background:rgba(255,255,255,.04); border:1.5px solid rgba(255,255,255,.09); border-radius:10px; color:#E8E8F0; font-family:'DM Sans',sans-serif; font-size:14px; outline:none; transition:border-color .2s,background .2s; }
  .fi:focus,.fsel:focus,.fta:focus { border-color:#A78BFA; background:rgba(167,139,250,.05); }
  .fi.err,.fsel.err { border-color:#F87171; }
  .ferr { font-size:11px; color:#F87171; margin-top:4px; }
  .fsel { appearance:none; cursor:pointer; }
  .fta  { resize:vertical; min-height:110px; }
  .priow { display:flex; gap:8px; }
  .pb { flex:1; padding:9px; border-radius:9px; border:1.5px solid rgba(255,255,255,.08); cursor:pointer; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; background:rgba(255,255,255,.03); color:#7070A0; transition:all .2s; }
  .pb.p-low  { border-color:#4CAF50; color:#4CAF50; background:rgba(76,175,80,.1); }
  .pb.p-med  { border-color:#FF9800; color:#FF9800; background:rgba(255,152,0,.1); }
  .pb.p-high { border-color:#F44336; color:#F44336; background:rgba(244,67,54,.1); }

  /* SUCCESS */
  .succ { text-align:center; padding:70px 30px; max-width:520px; margin:0 auto; }
  .succ-ic { width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg,#A78BFA,#34D399); display:flex; align-items:center; justify-content:center; font-size:32px; margin:0 auto 24px; animation:pop .5s cubic-bezier(.34,1.56,.64,1); }
  @keyframes pop { from{transform:scale(0)} to{transform:scale(1)} }
  .succ-id { display:inline-block; padding:7px 18px; border-radius:100px; background:rgba(167,139,250,.1); border:1px solid rgba(167,139,250,.3); font-family:'Syne',sans-serif; font-size:13px; color:#A78BFA; margin:14px 0 28px; letter-spacing:1px; }

  /* LIST */
  .lcont { width:100%; max-width:860px; padding:36px 0; }
  .lhdr  { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
  .ltitle { font-family:'Syne',sans-serif; font-size:24px; font-weight:800; }
  .swrap { display:flex; align-items:center; gap:8px; background:rgba(255,255,255,.04); border:1.5px solid rgba(255,255,255,.08); border-radius:10px; padding:9px 14px; }
  .swrap input { background:none; border:none; outline:none; color:#E8E8F0; font-family:'DM Sans',sans-serif; font-size:13px; width:200px; }
  .swrap input::placeholder { color:#4040A0; }
  .cc { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:14px; padding:20px 22px; margin-bottom:10px; display:grid; grid-template-columns:1fr auto; align-items:center; gap:16px; transition:background .2s,border-color .2s; }
  .cc:hover { background:rgba(255,255,255,.05); border-color:rgba(255,255,255,.12); }
  .cid   { font-family:'Syne',sans-serif; font-size:11px; color:#4040A0; margin-bottom:5px; letter-spacing:1px; }
  .csubj { font-size:14px; font-weight:500; color:#E8E8F0; margin-bottom:7px; }
  .cmeta { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
  .cpchip { font-size:11px; padding:2px 8px; border-radius:5px; font-weight:600; }
  .ccat  { font-size:11px; color:#5050A0; }
  .cdate { font-size:11px; color:#3030A0; }
  .sbadge { padding:5px 12px; border-radius:100px; font-size:11px; font-weight:600; white-space:nowrap; }
  .empty { text-align:center; padding:70px 20px; color:#3030A0; }

  @media(max-width:700px){
    .pgrid{grid-template-columns:1fr} .psel{grid-template-columns:1fr}
    .frow{grid-template-columns:1fr} .stats-grid{grid-template-columns:repeat(2,1fr)}
    .srow{flex-direction:column} .auth-card{padding:32px 20px}
    .otp-input{width:40px;height:48px;font-size:18px}
    .tbl th:nth-child(4),.tbl td:nth-child(4){display:none}
  }
`;

/* ─────────────────────────────────────────────
   STUDENT LOGIN — vrai envoi EmailJS
───────────────────────────────────────────── */
function StudentLogin({ onLogin }) {
  const [step,      setStep]      = useState(1);
  const [email,     setEmail]     = useState("");
  const [otp,       setOtp]       = useState(["","","","","",""]);
  const [generated, setGenerated] = useState("");
  const [err,       setErr]       = useState("");
  const [sending,   setSending]   = useState(false);
  const [countdown, setCountdown] = useState(0);

  /* Countdown timer */
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const formatTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const timerClass = countdown > 300 ? "ok" : countdown > 60 ? "warn" : "exp";

  /* Envoie le code via EmailJS */
  const handleSendCode = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErr("Veuillez entrer une adresse email valide.");
      return;
    }
    setErr("");
    setSending(true);

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expireTime = new Date(Date.now() + 15 * 60000).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: email,
          passcode: code,
          time:     expireTime,
        },
        EMAILJS_PUBLIC_KEY
      );
      setGenerated(code);
      setStep(2);
      setCountdown(15 * 60); // 15 minutes
      setOtp(["","","","","",""]);
    } catch (e) {
      setErr("Erreur d'envoi. Vérifiez votre email et réessayez.");
      console.error("EmailJS error:", e);
    } finally {
      setSending(false);
    }
  };

  /* OTP input handlers */
  const handleOtpChange = (index, value) => {
    const val = value.replace(/\D/g,"").slice(-1);
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    setErr("");
    if (val && index < 5) document.getElementById(`otp-${index+1}`)?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      document.getElementById(`otp-${index-1}`)?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      document.getElementById("otp-5")?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = () => {
    const entered = otp.join("");
    if (entered.length < 6) { setErr("Entrez les 6 chiffres du code."); return; }
    if (countdown <= 0)      { setErr("Le code a expiré. Veuillez en demander un nouveau."); return; }
    if (entered !== generated){ setErr("Code incorrect. Veuillez réessayer."); return; }
    onLogin(email);
  };

  const handleResend = () => {
    setStep(1);
    setOtp(["","","","","",""]);
    setErr("");
    setCountdown(0);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-icon student">🎓</div>

        {step === 1 && (
          <>
            <div className="auth-title">Connexion Étudiant</div>
            <p className="auth-sub">
              Entrez votre adresse email universitaire. Un code de confirmation vous sera envoyé.
            </p>
            <input
              className={`finput${err?" err":""}`}
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setErr(""); }}
              onKeyDown={e => e.key==="Enter" && !sending && handleSendCode()}
              autoFocus
            />
            {err && <p className="lerr">{err}</p>}
            <button
              className="primary-btn student-primary"
              onClick={handleSendCode}
              disabled={sending}
            >
              {sending ? "Envoi en cours..." : "Recevoir le code par email →"}
            </button>
            {sending && (
              <div className="sending-box" style={{ marginTop:"16px" }}>
                <div className="sending-spinner" />
                <div className="sending-text">Envoi du code à {email}…</div>
              </div>
            )}
            <p style={{ fontSize:"12px", color:"#4040A0", textAlign:"center", marginTop:"16px" }}>
              Pas besoin de créer un compte.
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <div className="auth-title">Vérification</div>

            {/* Confirmation envoi */}
            <div className="sent-box">
              <span className="sent-icon">✉️</span>
              <div className="sent-text">
                Code envoyé à <span className="sent-email">{email}</span>. Vérifiez votre boîte de réception (et vos spams).
              </div>
            </div>

            {/* Timer */}
            <div className="timer-bar">
              <span className="timer-txt">Code valide encore</span>
              <span className={`timer-num ${timerClass}`}>
                {countdown > 0 ? formatTime(countdown) : "Expiré"}
              </span>
            </div>

            {/* Saisie OTP */}
            <div className="otp-wrap" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  className={`otp-input${digit?" filled":""}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  autoFocus={i===0}
                  disabled={countdown<=0}
                />
              ))}
            </div>

            {err && <p className="lerr">{err}</p>}

            <button
              className="primary-btn student-primary"
              onClick={handleVerify}
              disabled={countdown<=0}
            >
              Confirmer et accéder →
            </button>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"16px" }}>
              <button className="link-btn" onClick={handleResend}>← Changer l'email</button>
              <button className="link-btn" onClick={handleSendCode} disabled={sending}>
                {sending ? "Envoi..." : "Renvoyer le code"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ADMIN LOGIN
───────────────────────────────────────────── */
function AdminLogin({ onLogin }) {
  const [login, setLogin] = useState("");
  const [pwd,   setPwd]   = useState("");
  const [err,   setErr]   = useState("");

  const handle = () => {
    if (login===ADMIN_CREDS.login && pwd===ADMIN_CREDS.password) { setErr(""); onLogin(); }
    else setErr("Identifiants incorrects.");
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-icon admin">🛡️</div>
        <div className="auth-title">Accès Administrateur</div>
        <p className="auth-sub">Connectez-vous pour accéder au tableau de bord.</p>
        <input className={`finput admin-focus${err?" err":""}`} placeholder="Identifiant" value={login} onChange={e=>setLogin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} />
        <input className={`finput admin-focus${err?" err":""}`} placeholder="Mot de passe" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} />
        {err && <p className="lerr">{err}</p>}
        <button className="primary-btn admin-primary" onClick={handle}>Se connecter</button>
        <p style={{ fontSize:"11px", color:"#3030A0", textAlign:"center", marginTop:"16px" }}>Démo : admin / admin123</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ADMIN DASHBOARD
───────────────────────────────────────────── */
function AdminDashboard({ complaints, onChangeStatus, onDetail }) {
  const [search, setSearch]   = useState("");
  const [fStatus,setFStatus]  = useState("Tous");
  const [fPlat,  setFPlat]    = useState("Tous");

  const filtered = complaints.filter(c => {
    const ms = fStatus==="Tous" || c.status===fStatus;
    const mp = fPlat==="Tous"   || c.platform===fPlat;
    const mt = !search || c.subject.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase()) || `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase());
    return ms && mp && mt;
  });

  const counts = { total:complaints.length, pending:complaints.filter(c=>c.status==="En attente").length, inprogress:complaints.filter(c=>c.status==="En cours").length, resolved:complaints.filter(c=>c.status==="Validé").length };

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <div><h2 className="admin-title">Tableau de bord</h2><p style={{fontSize:"13px",color:"#5050A0",marginTop:"4px"}}>Gestion des réclamations étudiantes</p></div>
        <span className="admin-badge">⚡ Accès Admin</span>
      </div>
      <div className="stats-grid">
        {[{l:"Total",v:counts.total,g:"linear-gradient(135deg,#A78BFA,#60A5FA)"},{l:"En attente",v:counts.pending,g:"linear-gradient(135deg,#FF9800,#FF6F00)"},{l:"En cours",v:counts.inprogress,g:"linear-gradient(135deg,#2196F3,#00B8FF)"},{l:"Validées",v:counts.resolved,g:"linear-gradient(135deg,#4CAF50,#34D399)"}].map(({l,v,g})=>(
          <div className="stat-card" key={l}><div className="stat-num" style={{background:g,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{v}</div><div className="stat-lbl">{l}</div></div>
        ))}
      </div>
      <div className="filters">
        <div className="search-wrap"><span style={{color:"#4040A0"}}>🔍</span><input placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
        <select className="filter-sel" value={fStatus} onChange={e=>setFStatus(e.target.value)}>{["Tous",...STATUSES].map(s=><option key={s}>{s}</option>)}</select>
        <select className="filter-sel" value={fPlat} onChange={e=>setFPlat(e.target.value)}><option>Tous</option>{PLATFORMS.map(p=><option key={p.id}>{p.name}</option>)}</select>
      </div>
      <table className="tbl">
        <thead><tr>{["ID","Étudiant","Plateforme","Objet","Priorité","Statut","Actions"].map(h=><th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {filtered.length===0
            ? <tr><td colSpan={7} style={{textAlign:"center",padding:"40px",color:"#3030A0"}}>Aucun résultat</td></tr>
            : filtered.map(c=>{
              const plat=PLATFORMS.find(p=>p.name===c.platform);
              const prioc=c.priority==="high"?"#F44336":c.priority==="medium"?"#FF9800":"#4CAF50";
              const sc=STATUS_COLORS[c.status]||"#A78BFA";
              return (
                <tr key={c.id}>
                  <td><span style={{fontFamily:"Syne,sans-serif",fontSize:"11px",color:"#5050A0",letterSpacing:"1px"}}>{c.id}</span></td>
                  <td><div style={{fontSize:"13px",fontWeight:"500"}}>{c.firstName} {c.lastName}</div><div style={{fontSize:"11px",color:"#5050A0"}}>{c.studentId}</div></td>
                  <td><span className="plat-chip" style={{background:plat?plat.color+"25":"#fff2",color:plat?plat.accent:"#A0A0C0"}}>{c.platform}</span></td>
                  <td style={{fontSize:"12px",color:"#C0C0D0",maxWidth:"200px"}}>{c.subject.length>42?c.subject.slice(0,42)+"…":c.subject}</td>
                  <td><span className="prio-dot" style={{background:prioc}}/><span style={{fontSize:"12px",color:prioc}}>{c.priority==="high"?"Urgente":c.priority==="medium"?"Moyenne":"Faible"}</span></td>
                  <td><select className="status-sel" value={c.status} onChange={e=>onChangeStatus(c.id,e.target.value)} style={{background:sc+"25",color:sc,border:`1.5px solid ${sc}66`}}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></td>
                  <td><button className="detail-btn" onClick={()=>onDetail(c.id)}>Détails</button></td>
                </tr>
              );
            })
          }
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DETAIL MODAL
───────────────────────────────────────────── */
function DetailModal({ c, onClose, onChangeStatus }) {
  const sc=STATUS_COLORS[c.status]||"#A78BFA";
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-card">
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-id">{c.id}</div>
        <div className="modal-title">{c.subject}</div>
        {[["Étudiant",`${c.firstName} ${c.lastName}`],["N° étudiant",c.studentId],["Email",c.email],["Plateforme",c.platform],["Catégorie",c.category],["Date",c.date],["Priorité",c.priority==="high"?"Urgente":c.priority==="medium"?"Moyenne":"Faible"]].map(([k,v])=>(
          <div className="modal-row" key={k}><span className="modal-key">{k}</span><span className="modal-val">{v}</span></div>
        ))}
        <div className="modal-row" style={{marginTop:"4px"}}>
          <span className="modal-key">Statut</span>
          <select value={c.status} onChange={e=>onChangeStatus(c.id,e.target.value)} style={{background:sc+"25",color:sc,border:`1.5px solid ${sc}66`,padding:"5px 10px",borderRadius:"8px",fontSize:"12px",fontWeight:"600",outline:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>
            {STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="modal-desc"><p>Description</p>{c.description}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HOME VIEW
───────────────────────────────────────────── */
function HomeView({ complaints, onPickPlatform }) {
  return (
    <div className="hero">
      <div className="hero-badge">● Plateforme de support étudiant</div>
      <h1>Votre voix,<br /><span>notre priorité</span></h1>
      <p className="hero-sub">Signalez vos problèmes sur Coursera, CrossKnowledge et Oracle MyLearn. Notre équipe traite chaque réclamation rapidement.</p>
      <div className="pgrid">
        {PLATFORMS.map(p=>(
          <div key={p.id} className="pcard" style={{"--ac":p.accent}} onClick={()=>onPickPlatform(p.id)}>
            <div className="plogo" style={{background:p.color}}>{p.logo}</div>
            <div className="pname">{p.name}</div>
            <div className="pdesc">{p.id==="coursera"?"Accès aux cours, certificats, vidéos et évaluations":p.id==="crossknowledge"?"Modules, parcours de formation et interface":"Certifications, labs virtuels et examens"}</div>
            <div className="parrow">→ Déposer une réclamation</div>
          </div>
        ))}
      </div>
      <div className="srow">
        <div className="si"><div className="sn">{complaints.length}</div><div className="slbl">Réclamations soumises</div></div>
        <div className="si"><div className="sn">{complaints.filter(c=>c.status==="Validé").length}</div><div className="slbl">Dossiers validés</div></div>
        <div className="si"><div className="sn">48h</div><div className="slbl">Délai de réponse</div></div>
        <div className="si"><div className="sn">3</div><div className="slbl">Plateformes couvertes</div></div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FORM VIEW
───────────────────────────────────────────── */
function FormView({ initialPlatform, studentEmail, onSubmitSuccess, onCancel }) {
  const [step,     setStep]     = useState(1);
  const [platform, setPlatform] = useState(initialPlatform||null);
  const [form,     setForm]     = useState({...FORM_INIT, email:studentEmail||""});
  const [errors,   setErrors]   = useState({});

  const validate=(s,plt,frm)=>{
    const e={};
    if(s===1&&!plt) e.platform="Veuillez choisir une plateforme";
    if(s===2){
      if(!frm.firstName.trim()) e.firstName="Requis";
      if(!frm.lastName.trim())  e.lastName="Requis";
      if(!frm.studentId.trim()) e.studentId="Requis";
      if(!frm.email.trim())     e.email="Requis";
      else if(!/\S+@\S+\.\S+/.test(frm.email)) e.email="Email invalide";
      if(!frm.category)         e.category="Catégorie requise";
    }
    if(s===3){
      if(!frm.subject.trim())     e.subject="Requis";
      if(!frm.description.trim()) e.description="Requis";
    }
    return e;
  };

  const handleNext=()=>{ const e=validate(step,platform,form); setErrors(e); if(Object.keys(e).length===0) setStep(s=>s+1); };
  const handleBack=()=>{ if(step===1){onCancel();return;} setErrors({}); setStep(s=>s-1); };
  const handleSubmit=()=>{ const e=validate(3,platform,form); setErrors(e); if(Object.keys(e).length>0)return; const plat=PLATFORMS.find(p=>p.id===platform); onSubmitSuccess({platform:plat.name,...form}); };
  const setField=(f,v)=>setForm(prev=>({...prev,[f]:v}));

  return (
    <div className="fwrap">
      <button className="back-btn" onClick={handleBack}>← Retour</button>
      <div className="stepper">
        {["Plateforme","Vos infos","Détails"].map((label,i)=>(
          <React.Fragment key={i}>
            <div className={`s-circle ${step>i+1?"done":step===i+1?"active":"todo"}`}>{step>i+1?"✓":i+1}</div>
            <span className={`s-label${step===i+1?" active":""}`}>{label}</span>
            {i<2&&<div className={`s-line${step>i+1?" done":""}`}/>}
          </React.Fragment>
        ))}
      </div>

      {step===1&&(
        <div>
          <h2 style={{fontFamily:"Syne,sans-serif",fontSize:"22px",fontWeight:800,marginBottom:"6px"}}>Choisir la plateforme</h2>
          <p style={{fontSize:"13px",color:"#5050A0",marginBottom:"24px"}}>Sur quelle plateforme rencontrez-vous un problème ?</p>
          {errors.platform&&<p style={{color:"#F87171",fontSize:"12px",marginBottom:"14px"}}>⚠ {errors.platform}</p>}
          <div className="psel">
            {PLATFORMS.map(p=>(
              <div key={p.id} className={`po${platform===p.id?" sel":""}`} style={{"--ac":p.accent}} onClick={()=>setPlatform(p.id)}>
                <div className="pol" style={{background:p.color}}>{p.logo}</div>
                <div className="pon">{p.name}</div>
              </div>
            ))}
          </div>
          <button className="primary-btn" onClick={handleNext}>Continuer →</button>
        </div>
      )}

      {step===2&&(
        <div>
          <h2 style={{fontFamily:"Syne,sans-serif",fontSize:"22px",fontWeight:800,marginBottom:"6px"}}>Vos informations</h2>
          <p style={{fontSize:"13px",color:"#5050A0",marginBottom:"24px"}}>Renseignez vos coordonnées pour identifier votre dossier.</p>
          <div className="frow">
            <div className="ff"><label className="flbl">Prénom *</label><input className={`fi${errors.firstName?" err":""}`} value={form.firstName} onChange={e=>setField("firstName",e.target.value)} placeholder="Votre prénom"/>{errors.firstName&&<span className="ferr">{errors.firstName}</span>}</div>
            <div className="ff"><label className="flbl">Nom *</label><input className={`fi${errors.lastName?" err":""}`} value={form.lastName} onChange={e=>setField("lastName",e.target.value)} placeholder="Votre nom"/>{errors.lastName&&<span className="ferr">{errors.lastName}</span>}</div>
          </div>
          <div className="frow">
            <div className="ff"><label className="flbl">Numéro étudiant *</label><input className={`fi${errors.studentId?" err":""}`} value={form.studentId} onChange={e=>setField("studentId",e.target.value)} placeholder="ETU-2024-XXXX"/>{errors.studentId&&<span className="ferr">{errors.studentId}</span>}</div>
            <div className="ff"><label className="flbl">Email *</label><input className={`fi${errors.email?" err":""}`} type="email" value={form.email} onChange={e=>setField("email",e.target.value)} placeholder="votre@email.com" readOnly={!!studentEmail} style={studentEmail?{opacity:.7,cursor:"not-allowed"}:{}}/>{errors.email&&<span className="ferr">{errors.email}</span>}</div>
          </div>
          <div className="ff">
            <label className="flbl">Catégorie *</label>
            <select className={`fsel${errors.category?" err":""}`} value={form.category} onChange={e=>setField("category",e.target.value)}>
              <option value="">— Sélectionnez une catégorie —</option>
              {(CATEGORIES[platform]||[]).map(c=><option key={c}>{c}</option>)}
            </select>
            {errors.category&&<span className="ferr">{errors.category}</span>}
          </div>
          <button className="primary-btn" onClick={handleNext}>Continuer →</button>
        </div>
      )}

      {step===3&&(
        <div>
          <h2 style={{fontFamily:"Syne,sans-serif",fontSize:"22px",fontWeight:800,marginBottom:"6px"}}>Décrire le problème</h2>
          <p style={{fontSize:"13px",color:"#5050A0",marginBottom:"24px"}}>Plus la description est précise, plus vite nous pouvons aider.</p>
          <div className="ff">
            <label className="flbl">Niveau de priorité</label>
            <div className="priow">
              {PRIORITIES.map(p=>(
                <button key={p.value} type="button" className={`pb${form.priority===p.value?` p-${p.value==="low"?"low":p.value==="medium"?"med":"high"}`:""}`} onClick={()=>setField("priority",p.value)}>{p.label}</button>
              ))}
            </div>
          </div>
          <div className="ff"><label className="flbl">Objet *</label><input className={`fi${errors.subject?" err":""}`} value={form.subject} onChange={e=>setField("subject",e.target.value)} placeholder="Résumez en une ligne..."/>{errors.subject&&<span className="ferr">{errors.subject}</span>}</div>
          <div className="ff"><label className="flbl">Description *</label><textarea className={`fta${errors.description?" err":""}`} value={form.description} onChange={e=>setField("description",e.target.value)} placeholder="Détaillez le problème..."/>{errors.description&&<span className="ferr">{errors.description}</span>}</div>
          <button className="primary-btn" onClick={handleSubmit}>✓ Soumettre la réclamation</button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SUCCESS VIEW
───────────────────────────────────────────── */
function SuccessView({ newId, onViewList, onNewComplaint }) {
  return (
    <div className="succ">
      <div className="succ-ic">✓</div>
      <h2 style={{fontFamily:"Syne,sans-serif",fontSize:"28px",fontWeight:800,marginBottom:"10px"}}>Réclamation envoyée !</h2>
      <p style={{color:"#6060A0",fontSize:"15px",lineHeight:1.6}}>Votre dossier a été enregistré. Notre équipe le traitera dans les plus brefs délais.</p>
      <div className="succ-id">{newId}</div>
      <p style={{fontSize:"13px",color:"#5050A0",marginBottom:"28px"}}>Conservez cet identifiant pour suivre votre réclamation.</p>
      <div style={{display:"flex",gap:"10px",justifyContent:"center",flexWrap:"wrap"}}>
        <button className="primary-btn" style={{width:"auto",padding:"12px 24px"}} onClick={onViewList}>Voir mes réclamations</button>
        <button className="ghost-btn" onClick={onNewComplaint}>Nouvelle réclamation</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LIST VIEW
───────────────────────────────────────────── */
function ListView({ complaints, studentEmail }) {
  const [search, setSearch] = useState("");
  const mine = complaints.filter(c=>c.email===studentEmail);
  const filtered = mine.filter(c=>c.subject.toLowerCase().includes(search.toLowerCase())||c.id.toLowerCase().includes(search.toLowerCase())||c.platform.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="lcont">
      <div className="lhdr">
        <div><h2 className="ltitle">Mes réclamations</h2><p style={{fontSize:"12px",color:"#5050A0",marginTop:"4px"}}>{mine.length} dossier{mine.length!==1?"s":""} associé{mine.length!==1?"s":""} à {studentEmail}</p></div>
        <div className="swrap"><span style={{color:"#4040A0"}}>🔍</span><input placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      </div>
      {filtered.length===0
        ? <div className="empty"><div style={{fontSize:"40px",marginBottom:"12px"}}>📂</div><p>{mine.length===0?"Aucune réclamation pour ce compte.":"Aucun résultat."}</p></div>
        : filtered.map(c=>{
          const plat=PLATFORMS.find(p=>p.name===c.platform);
          const sc=STATUS_COLORS[c.status]||"#A78BFA";
          return (
            <div key={c.id} className="cc">
              <div>
                <div className="cid">{c.id}</div>
                <div className="csubj">{c.subject}</div>
                <div className="cmeta">
                  <span className="cpchip" style={{background:plat?plat.color+"25":"#fff2",color:plat?plat.accent:"#A0A0C0"}}>{c.platform}</span>
                  <span className="ccat">{c.category}</span>
                  <span className="cdate">· {c.date}</span>
                </div>
              </div>
              <span className="sbadge" style={{background:sc+"22",color:sc}}>{c.status}</span>
            </div>
          );
        })
      }
    </div>
  );
}

/* ─────────────────────────────────────────────
   APP
───────────────────────────────────────────── */
export default function App() {
  const [view,          setView]          = useState("home");
  const [studentEmail,  setStudentEmail]  = useState(null);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
 // ✅ APRÈS (correct)
const [complaints, setComplaints] = useState([]);
const [lastId, setLastId] = useState("");
const [initPlatform, setInitPlatform] = useState(null);

// Charger les réclamations au démarrage depuis le backend
useEffect(() => {
  complaintApi.getAll()
    .then(data => setComplaints(data))
    .catch(err => console.error("Erreur chargement réclamations:", err));
}, []);
  const [detailId,      setDetailId]      = useState(null);

  const handleStudentLogin  = (email) => { setStudentEmail(email); setView("home"); };
  const handleStudentLogout = ()      => { setStudentEmail(null);  setView("home"); };

// ✅ APRÈS
const handleFormSubmit = useCallback(async (data) => {
  try {
    const created = await complaintApi.create(data);
    setComplaints(prev => [created, ...prev]);
    setLastId(created.id);
    setView("success");
  } catch (err) {
    alert("Erreur lors de la soumission : " + err.message);
  }
}, []);

  // ✅ APRÈS
const handleChangeStatus = useCallback(async (id, newStatus) => {
  try {
    const updated = await complaintApi.updateStatus(id, newStatus);
    setComplaints(prev => prev.map(c => c.id === id ? updated : c));
  } catch (err) {
    console.error("Erreur mise à jour statut:", err);
  }
}, []);

  const handlePickPlatform = (pid) => {
    setInitPlatform(pid);
    if (!studentEmail) { setView("student-login"); return; }
    setView("new");
  };

  const goNewComplaint = () => {
    setInitPlatform(null);
    if (!studentEmail) { setView("student-login"); return; }
    setView("new");
  };

  const detailComplaint = complaints.find(c=>c.id===detailId);

  return (
    <>
      <style>{css}</style>
      <div style={{minHeight:"100vh",background:"#0A0A0F",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <nav className="nav">
          <div className="nav-inner">
            <div className="brand" onClick={()=>setView("home")}>EduDesk</div>
            <div className="nav-links">
              {!adminLoggedIn&&(
                <>
                  <button className={`nbtn${view==="home"?" act":""}`} onClick={()=>setView("home")}>Accueil</button>
                  {studentEmail ? (
                    <>
                      <button className={`nbtn${view==="new"?" act":""}`}  onClick={goNewComplaint}>Nouvelle réclamation</button>
                      <button className={`nbtn${view==="list"?" act":""}`} onClick={()=>setView("list")}>Mes réclamations</button>
                      <div className="user-pill">
                        <div className="user-avatar">{studentEmail[0].toUpperCase()}</div>
                        <span className="user-email">{studentEmail}</span>
                      </div>
                      <button className="nbtn" onClick={handleStudentLogout}>Déconnexion</button>
                    </>
                  ):(
                    <button className="nbtn student-btn" onClick={()=>setView("student-login")}>🎓 Connexion étudiant</button>
                  )}
                </>
              )}
              {adminLoggedIn&&(
                <>
                  <button className={`nbtn${view==="admin"?" adm-act":" adm"}`} onClick={()=>setView("admin")}>Dashboard Admin</button>
                  <button className="nbtn" onClick={()=>{setAdminLoggedIn(false);setView("home");}}>→ Déconnexion</button>
                </>
              )}
              {!adminLoggedIn&&(
                <button className="nbtn adm" onClick={()=>setView("admin-login")}>🔐 Admin</button>
              )}
            </div>
          </div>
        </nav>

        <div className="pw">
          {view==="home"          && <HomeView complaints={complaints} onPickPlatform={handlePickPlatform}/>}
          {view==="student-login" && <StudentLogin onLogin={handleStudentLogin}/>}
          {view==="new" && studentEmail && <FormView key={`${initPlatform}-${Date.now()}`} initialPlatform={initPlatform} studentEmail={studentEmail} onSubmitSuccess={handleFormSubmit} onCancel={()=>setView("home")}/>}
          {view==="success"       && <SuccessView newId={lastId} onViewList={()=>setView("list")} onNewComplaint={goNewComplaint}/>}
          {view==="list" && studentEmail && <ListView complaints={complaints} studentEmail={studentEmail}/>}
          {view==="admin-login"   && <AdminLogin onLogin={()=>{setAdminLoggedIn(true);setView("admin");}}/>}
          {view==="admin" && !adminLoggedIn && <AdminLogin onLogin={()=>{setAdminLoggedIn(true);setView("admin");}}/>}
          {view==="admin" && adminLoggedIn  && <AdminDashboard complaints={complaints} onChangeStatus={handleChangeStatus} onDetail={setDetailId}/>}
        </div>

        {detailComplaint&&<DetailModal c={detailComplaint} onClose={()=>setDetailId(null)} onChangeStatus={handleChangeStatus}/>}
      </div>
    </>
  );
}
