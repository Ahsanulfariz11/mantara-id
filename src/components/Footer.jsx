import React from 'react';

export default function Footer({ lang }) {
  const isId = lang === 'id';

  return (
    <footer className="w-full bg-white border-t border-slate-200 pt-10 pb-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-10">
          
          {/* Logo & Contact */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <div className="bg-primary text-white p-1.5 rounded-lg">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2c-1.5 0-3 1.5-4 3-1.5 2.5-4 5-6 6 2 1 4.5 1.5 6 1.5 1 0 2.5.5 3.5 2.5 1-2 2.5-2.5 3.5-2.5 1.5 0 4-.5 6-1.5-2-1-4.5-3.5-6-6-1-1.5-2.5-3-4-3z"/></svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">MANTARA</h1>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <i className="fa-brands fa-whatsapp text-primary text-xl mt-0.5"></i>
                <div>
                  <p className="text-sm font-semibold text-slate-700">WhatsApp</p>
                  <p className="text-sm text-slate-500">+62 812 3456 7890</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <i className="fa-regular fa-envelope text-primary text-xl mt-0.5"></i>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Email</p>
                  <p className="text-sm text-slate-500">cs@mantara.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-headset text-primary text-xl mt-0.5"></i>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Call Center</p>
                  <p className="text-sm text-slate-500">Indonesia only</p>
                  <p className="text-sm text-slate-500 font-medium">+62 804 1500 878</p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4">{isId ? 'Perusahaan' : 'Company'}</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><a href="#" className="hover:text-primary transition">{isId ? 'Tentang Kami' : 'About Us'}</a></li>
              <li><a href="#" className="hover:text-primary transition">Blog</a></li>
              <li><a href="#" className="hover:text-primary transition">{isId ? 'Karir' : 'Careers'}</a></li>
              <li><a href="#" className="hover:text-primary transition">Corporate</a></li>
              <li><a href="#" className="hover:text-primary transition">Partner</a></li>
            </ul>
          </div>

          {/* Products Links */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4">{isId ? 'Produk' : 'Products'}</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><a href="#" className="hover:text-primary transition">{isId ? 'Tiket Speedboat' : 'Speedboat Tickets'}</a></li>
              <li><a href="#" className="hover:text-primary transition">{isId ? 'Carter Kapal' : 'Boat Charter'}</a></li>
              <li><a href="#" className="hover:text-primary transition">{isId ? 'Tour Derawan' : 'Derawan Tour'}</a></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4">{isId ? 'Dukungan' : 'Support'}</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><a href="#" className="hover:text-primary transition">Help Center</a></li>
              <li><a href="#" className="hover:text-primary transition">{isId ? 'Kebijakan Privasi' : 'Privacy Policy'}</a></li>
              <li><a href="#" className="hover:text-primary transition">{isId ? 'Syarat & Ketentuan' : 'Terms & Conditions'}</a></li>
              <li><a href="#" className="hover:text-primary transition">{isId ? 'Daftarkan Kapal Anda' : 'Register Your Vessel'}</a></li>
            </ul>
          </div>

          {/* App Download */}
          <div className="lg:col-span-1">
            <h4 className="font-bold text-slate-900 mb-4">{isId ? 'Lebih murah di aplikasi' : 'Cheaper on the app'}</h4>
            <div className="flex flex-col gap-3">
              <button className="bg-black text-white rounded-lg px-4 py-2 flex items-center gap-3 transition">
                <i className="fa-brands fa-apple text-2xl"></i>
                <div className="text-left">
                  <p className="text-[10px] leading-tight opacity-80">Download on the</p>
                  <p className="text-sm font-semibold leading-tight">App Store</p>
                </div>
              </button>
              <button className="bg-black text-white rounded-lg px-4 py-2 flex items-center gap-3 transition">
                <i className="fa-brands fa-google-play text-xl"></i>
                <div className="text-left">
                  <p className="text-[10px] leading-tight opacity-80">GET IT ON</p>
                  <p className="text-sm font-semibold leading-tight">Google Play</p>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 border-dashed my-8"></div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Partners */}
          <div className="md:col-span-1">
            <h4 className="font-bold text-slate-900 mb-4">{isId ? 'Partner' : 'Partner'}</h4>
            <div className="flex flex-col gap-4">
              <img src="/wonderful.png" alt="Wonderful Indonesia" className="h-10 object-contain self-start" />
              <div className="text-xs text-slate-500 max-w-[150px] font-medium leading-tight">
                Official Partner of the Ministry of Tourism, Republic Indonesia
              </div>
            </div>
          </div>

          {/* Secure Transaction */}
          <div className="md:col-span-2">
            <h4 className="font-bold text-slate-900 mb-4">{isId ? 'Keamanan Transaksi' : 'Keamanan Transaksi'}</h4>
            <div className="flex items-center gap-3">
              {/* Visa Badge */}
              <div className="w-14 h-9 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200/80 shadow-sm select-none">
                <span className="text-[#1A1F71] font-black italic tracking-wider text-xs">VISA</span>
              </div>
              
              {/* Mastercard Badge */}
              <div className="w-14 h-9 bg-slate-100 rounded-lg flex items-center justify-center gap-1 border border-slate-200/80 shadow-sm select-none px-1">
                <div className="relative flex items-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-[#F59E0B] -ml-2 mix-blend-multiply"></div>
                </div>
                <span className="text-slate-600 font-extrabold text-[8px] tracking-tighter leading-none">mastercard</span>
              </div>

              {/* JCB Badge */}
              <div className="w-14 h-9 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200/80 shadow-sm select-none">
                <span className="text-[#005AA0] font-black tracking-wide text-xs">JCB</span>
              </div>
            </div>
          </div>

          {/* Follow Us */}
          <div className="md:col-span-1">
            <h4 className="font-bold text-slate-900 mb-4">{isId ? 'Ikuti Kami' : 'Follow us'}</h4>
            <div className="flex items-center gap-2.5">
              <a href="#" className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 select-none">
                <i className="fa-brands fa-facebook-f text-xs"></i>
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 select-none">
                <i className="fa-brands fa-twitter text-xs"></i>
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 select-none">
                <i className="fa-brands fa-instagram text-xs"></i>
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 select-none">
                <i className="fa-brands fa-youtube text-xs"></i>
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 select-none">
                <i className="fa-brands fa-tiktok text-xs"></i>
              </a>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 border-dashed my-6"></div>

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <p>© 2011-{new Date().getFullYear()} PT. Mantara Global Network. All Rights Reserved.</p>
          <div className="mt-4 md:mt-0 flex items-center gap-2 font-bold text-primary text-lg tracking-tight">
            <div className="bg-primary text-white p-1 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2c-1.5 0-3 1.5-4 3-1.5 2.5-4 5-6 6 2 1 4.5 1.5 6 1.5 1 0 2.5.5 3.5 2.5 1-2 2.5-2.5 3.5-2.5 1.5 0 4-.5 6-1.5-2-1-4.5-3.5-6-6-1-1.5-2.5-3-4-3z"/></svg>
            </div>
            MANTARA
          </div>
        </div>

      </div>
    </footer>
  );
}
