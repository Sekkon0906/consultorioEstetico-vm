"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const procedimientos = [
  { nombre: "Limpieza Facial Básica", categoria: "Facial" },
  { nombre: "Hydrafacial Elite", categoria: "Facial" },
  { nombre: "Peeling Químico", categoria: "Facial" },
  { nombre: "Ácido Hialurónico Facial", categoria: "Facial" },
  { nombre: "Toxina Botulínica (Bótox)", categoria: "Facial" },
  { nombre: "Plasma Rico en Plaquetas Facial", categoria: "Facial" },

  { nombre: "Sueroterapia", categoria: "Corporal" },
  { nombre: "Enzimas Lipolíticas", categoria: "Corporal" },
  { nombre: "Tratamiento de Estrías", categoria: "Corporal" },
  { nombre: "Hiperhidrosis Axilar / Palmar", categoria: "Corporal" },

  { nombre: "Hydrafacial Capilar (Keravive)", categoria: "Capilar" },
  { nombre: "Mesocapilar", categoria: "Capilar" },
  { nombre: "Plasma Rico en Plaquetas Capilar", categoria: "Capilar" },
];

export default function Footer() {
  const [animateIcons, setAnimateIcons] = useState(false);
  const [showProcedures, setShowProcedures] = useState(false);
  const [menuHeight, setMenuHeight] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimateIcons(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    procedure: "",
    phone: "",
    message: "",
    terms: false,
  });

  const procedimientosList = procedimientos.reduce<{ [key: string]: string[] }>(
    (acc, proc) => {
      if (!acc[proc.categoria]) {
        acc[proc.categoria] = [];
      }
      acc[proc.categoria].push(proc.nombre);
      return acc;
    },
    {}
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : undefined;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked ?? false : value,
    });
  };

  const handleProcedureSelect = (procedure: string) => {
    setFormData({ ...formData, procedure });
    setShowProcedures(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { name, email, phone, procedure, message } = formData;

    const texto = `*Nuevo mensaje desde la web de la Clínica Estética Dra. Juliet Medina*  

Mi nombre es ${name}, mi correo es ${email} y mi número de contacto es ${phone || "No especificado"}.
Tengo una pregunta con respecto al siguiente procedimiento: ${procedure || "No especificado"}  
Mi mensaje es: ${message}`;

    const numeroDestino = "573155445748";

    const url = `https://wa.me/${numeroDestino}?text=${encodeURIComponent(
      texto
    )}`;

    window.open(url, "_blank");

    setFormData({
      name: "",
      email: "",
      procedure: "",
      phone: "",
      message: "",
      terms: false,
    });
  };

  useEffect(() => {
    const content = document.getElementById("procedures-menu");
    if (content) {
      if (showProcedures) {
        const scrollHeight = content.scrollHeight;
        setMenuHeight(scrollHeight);
      } else {
        setMenuHeight(0);
      }
    }
  }, [showProcedures]);

  return (
    <footer
      className="text-white pt-16 pb-6 relative overflow-hidden"
      style={{ backgroundColor: "#6C584C" }}
    >
      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-[url('/images/bg-textura-beige.jpg')] bg-cover bg-center opacity-10"></div>
      <div className="absolute inset-0 bg-[#6C584C]/90"></div>

      <div className="relative container mx-auto px-6 z-10">
        {/* === FORMULARIO === */}
        <div className="text-center mb-12">
          <h3
            className="text-3xl font-semibold mb-8 font-[Montserrat]"
            style={{ color: "#E9DED2" }}
          >
            ¿Tienes alguna pregunta? Contáctame directamente por WhatsApp!
          </h3>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto"
          >
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              type="text"
              placeholder="Nombre Completo"
              className="bg-[#FAF9F7]/10 border border-[#B08968] text-[#FAF9F7] rounded-md px-4 py-2 placeholder-[#FAF9F7]/70 focus:outline-none focus:ring-2 focus:ring-[#B08968]"
              required
            />
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              placeholder="Correo electrónico"
              className="bg-[#FAF9F7]/10 border border-[#B08968] text-[#FAF9F7] rounded-md px-4 py-2 placeholder-[#FAF9F7]/70 focus:outline-none focus:ring-2 focus:ring-[#B08968]"
              required
            />

            {/* === Procedimientos === */}
            <div className="relative md:col-span-2">
              <button
                type="button"
                onClick={() => setShowProcedures(!showProcedures)}
                className="w-full bg-[#FAF9F7]/10 border border-[#B08968] text-left text-[#FAF9F7] rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#B08968] flex justify-between items-center"
              >
                {formData.procedure
                  ? `Procedimiento: ${formData.procedure}`
                  : "Selecciona un procedimiento"}
                <span
                  className={`text-[#B08968] text-xl transition-transform duration-300 ${
                    showProcedures ? "rotate-180" : ""
                  }`}
                >
                  
                </span>
              </button>

              <div
                id="procedures-menu"
                className="overflow-hidden transition-all duration-500 ease-in-out"
                style={{ maxHeight: menuHeight }}
              >
                <div className="bg-[#6C584C] border border-[#B08968] rounded-md mt-1 z-20 shadow-lg">
                  {Object.entries(procedimientosList).map(([categoria, items]) => (
                    <div key={categoria}>
                      <p className="px-4 py-2 font-semibold text-[#E9DED2] bg-[#B08968]/30 sticky top-0">
                        {categoria}
                      </p>
                      {items.map((proc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleProcedureSelect(proc)}
                          className="block w-full text-left px-4 py-2 text-[#FAF9F7] hover:bg-[#B08968]/40 transition-colors"
                        >
                          {proc}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              type="text"
              placeholder="Teléfono"
              className="bg-[#FAF9F7]/10 border border-[#B08968] text-[#FAF9F7] rounded-md px-4 py-2 placeholder-[#FAF9F7]/70 focus:outline-none focus:ring-2 focus:ring-[#B08968]"
            />
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              placeholder="Tu mensaje"
              className="md:col-span-2 bg-[#FAF9F7]/10 border border-[#B08968] text-[#FAF9F7] rounded-md px-4 py-2 placeholder-[#FAF9F7]/70 focus:outline-none focus:ring-2 focus:ring-[#B08968]"
              required
            ></textarea>

            <div className="flex items-center justify-center gap-2 md:col-span-2">
              <input
                name="terms"
                type="checkbox"
                checked={formData.terms}
                onChange={handleChange}
                className="accent-[#B08968]"
                required
              />
              <small className="text-[#FAF9F7]/80">
                Aceptas los términos y condiciones
              </small>
            </div>

            <div className="md:col-span-2 flex justify-center mt-4">
              <button
                type="submit"
                className="relative flex items-center justify-center gap-2 bg-[#B08968] text-[#FAF9F7] font-semibold px-10 py-3 rounded-full transition-all duration-300 shadow-md overflow-hidden group"
              >
                <i className="fab fa-whatsapp text-xl"></i>
                <span className="relative z-10">Enviar por WhatsApp</span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E9DED2]/70 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1.2s] ease-out"></span>
              </button>
            </div>
          </form>
        </div>

        {/* === INFORMACIÓN GENERAL === */}
        <div className="border-t border-[#B08968]/60 my-10"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h4 className="text-lg font-semibold mb-8 font-[Montserrat] text-[#E9DED2]">
              Clínica Estética Dra. Juliet Medina
            </h4>
            <p className="text-[#E9DED2]/80 text-sm">
              Atención personalizada y tratamientos de estética facial, corporal y capilar.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-8 font-[Montserrat] text-[#E9DED2]">
              Dirección
            </h4>
            <p className="text-[#E9DED2]/80 text-sm">
              Carrera 5ta #11-24. Edificio Torre Empresarial. Consultorio 502. Ibagué – Tolima.
              <br />
              Horarios: Lunes a Sábado, 9:00 a.m. - 6:00 p.m.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-8 font-[Montserrat] text-[#E9DED2]">
              Contacto
            </h4>
            <p className="text-[#E9DED2]/80 text-sm">
              WhatsApp: +57 315 544 5748
              <br />
              Email: dra.vanessamedinao@gmail.com
            </p>
          </div>
        </div>

        {/* === REDES === */}
        <div className="border-t border-[#B08968]/60 mt-10 pt-6 text-center">
          <div className="flex justify-center gap-8 mb-5">
            {[ 
              {
                href: "https://www.instagram.com/dravanessamedinao28/",
                icon: "fab fa-instagram",
              },
              {
                href: "https://www.facebook.com/profile.php?id=61556167276406",
                icon: "fab fa-facebook",
              },
              { href: "https://wa.me/573155445748", icon: "fab fa-whatsapp" },
            ].map((red, index) => (
              <a
                key={index}
                href={red.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`relative text-[#B08968] transition-all text-2xl overflow-hidden group ${
                  animateIcons ? "animate-shine" : ""
                }`}
              >
                <i className={red.icon}></i>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E9DED2]/60 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1.2s] ease-out"></span>
              </a>
            ))}
          </div>

          <p style={{ color: "#E9DED2", fontSize: "0.9rem" }}>
             2023 Clínica Estética Dra. Julieth Medina. Todos los derechos reservados.
          </p>

          {/* === Créditos === */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            style={{
              color: "#E9DED2",
              fontSize: "0.9rem",
              marginTop: "0.3rem",
            }}
          >
            Página diseñada por{" "}
            <a
              href="https://portafoliojmo.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="relative designer-link"
            >
              Juan Medina O.
              <span className="underline-anim"></span>
            </a>
          </motion.p>
        </div>
      </div>

      {/* === Estilos animados === */}
      <style jsx>{`
        .designer-link {
          color: #e9ded2;
          text-decoration: none;
          font-weight: 500;
          position: relative;
          display: inline-block;
          transition: color 0.3s ease, text-shadow 0.3s ease;
        }
        .designer-link:hover {
          color: #f0d8b0;
          text-shadow: 0 0 8px #80561fff;
        }
        .underline-anim {
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0%;
          height: 2px;
          background: linear-gradient(90deg, #b08968, #e9ded2, #b08968);
          transition: width 0.5s ease;
        }
        .designer-link:hover .underline-anim {
          width: 100%;
        }
      `}</style>
    </footer>
  );
}
