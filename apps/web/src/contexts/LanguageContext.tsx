'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'vi' | 'zh' | 'th' | 'id' | 'ms' | 'tl';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'cancel': 'Cancel',
    'save': 'Save',
    'delete': 'Delete',
    'edit': 'Edit',
    'search': 'Search',
    'filter': 'Filter',
    'sort': 'Sort',
    'price': 'Price',
    'quantity': 'Quantity',
    'total': 'Total',
    'subtotal': 'Subtotal',
    'shipping': 'Shipping',
    'tax': 'Tax',
    'discount': 'Discount',
    
    // Navigation
    'home': 'Home',
    'products': 'Products',
    'categories': 'Categories',
    'cart': 'Cart',
    'wishlist': 'Wishlist',
    'orders': 'Orders',
    'profile': 'Profile',
    'settings': 'Settings',
    'logout': 'Logout',
    'login': 'Login',
    'register': 'Register',
    
    // Product
    'add_to_cart': 'Add to Cart',
    'out_of_stock': 'Out of Stock',
    'in_stock': 'In Stock',
    'product_details': 'Product Details',
    'reviews': 'Reviews',
    'rating': 'Rating',
    'description': 'Description',
    'specifications': 'Specifications',
    
    // Cart
    'cart_empty': 'Your cart is empty',
    'checkout': 'Checkout',
    'continue_shopping': 'Continue Shopping',
    
    // Messages
    'product_added_to_cart': 'Product added to cart',
    'product_removed_from_cart': 'Product removed from cart',
    'product_added_to_wishlist': 'Product added to wishlist',
    'product_removed_from_wishlist': 'Product removed from wishlist',
  },
  vi: {
    // Common
    'loading': 'Đang tải...',
    'error': 'Lỗi',
    'success': 'Thành công',
    'cancel': 'Hủy',
    'save': 'Lưu',
    'delete': 'Xóa',
    'edit': 'Sửa',
    'search': 'Tìm kiếm',
    'filter': 'Bộ lọc',
    'sort': 'Sắp xếp',
    'price': 'Giá',
    'quantity': 'Số lượng',
    'total': 'Tổng',
    'subtotal': 'Tạm tính',
    'shipping': 'Vận chuyển',
    'tax': 'Thuế',
    'discount': 'Giảm giá',
    
    // Navigation
    'home': 'Trang chủ',
    'products': 'Sản phẩm',
    'categories': 'Danh mục',
    'cart': 'Giỏ hàng',
    'wishlist': 'Yêu thích',
    'orders': 'Đơn hàng',
    'profile': 'Hồ sơ',
    'settings': 'Cài đặt',
    'logout': 'Đăng xuất',
    'login': 'Đăng nhập',
    'register': 'Đăng ký',
    
    // Product
    'add_to_cart': 'Thêm vào giỏ hàng',
    'out_of_stock': 'Hết hàng',
    'in_stock': 'Còn hàng',
    'product_details': 'Chi tiết sản phẩm',
    'reviews': 'Đánh giá',
    'rating': 'Đánh giá',
    'description': 'Mô tả',
    'specifications': 'Thông số kỹ thuật',
    
    // Cart
    'cart_empty': 'Giỏ hàng của bạn trống',
    'checkout': 'Thanh toán',
    'continue_shopping': 'Tiếp tục mua sắm',
    
    // Messages
    'product_added_to_cart': 'Đã thêm sản phẩm vào giỏ hàng',
    'product_removed_from_cart': 'Đã xóa sản phẩm khỏi giỏ hàng',
    'product_added_to_wishlist': 'Đã thêm sản phẩm vào yêu thích',
    'product_removed_from_wishlist': 'Đã xóa sản phẩm khỏi yêu thích',
  },
  zh: {
    // Chinese translations
    'loading': '加载中...',
    'error': '错误',
    'success': '成功',
    'cancel': '取消',
    'save': '保存',
    'delete': '删除',
    'edit': '编辑',
    'search': '搜索',
    'filter': '筛选',
    'sort': '排序',
    'price': '价格',
    'quantity': '数量',
    'total': '总计',
    'subtotal': '小计',
    'shipping': '运费',
    'tax': '税费',
    'discount': '折扣',
    
    // Navigation
    'home': '首页',
    'products': '产品',
    'categories': '分类',
    'cart': '购物车',
    'wishlist': '收藏',
    'orders': '订单',
    'profile': '个人资料',
    'settings': '设置',
    'logout': '退出',
    'login': '登录',
    'register': '注册',
    
    // Product
    'add_to_cart': '加入购物车',
    'out_of_stock': '缺货',
    'in_stock': '有货',
    'product_details': '产品详情',
    'reviews': '评论',
    'rating': '评分',
    'description': '描述',
    'specifications': '规格',
    
    // Cart
    'cart_empty': '购物车为空',
    'checkout': '结账',
    'continue_shopping': '继续购物',
    
    // Messages
    'product_added_to_cart': '产品已添加到购物车',
    'product_removed_from_cart': '产品已从购物车移除',
    'product_added_to_wishlist': '产品已添加到收藏',
    'product_removed_from_wishlist': '产品已从收藏移除',
  },
  th: {
    // Thai translations
    'loading': 'กำลังโหลด...',
    'error': 'ข้อผิดพลาด',
    'success': 'สำเร็จ',
    'cancel': 'ยกเลิก',
    'save': 'บันทึก',
    'delete': 'ลบ',
    'edit': 'แก้ไข',
    'search': 'ค้นหา',
    'filter': 'กรอง',
    'sort': 'เรียงลำดับ',
    'price': 'ราคา',
    'quantity': 'จำนวน',
    'total': 'รวม',
    'subtotal': 'รวมย่อย',
    'shipping': 'จัดส่ง',
    'tax': 'ภาษี',
    'discount': 'ส่วนลด',
    
    // Navigation
    'home': 'หน้าแรก',
    'products': 'สินค้า',
    'categories': 'หมวดหมู่',
    'cart': 'ตะกร้า',
    'wishlist': 'รายการโปรด',
    'orders': 'คำสั่งซื้อ',
    'profile': 'โปรไฟล์',
    'settings': 'การตั้งค่า',
    'logout': 'ออกจากระบบ',
    'login': 'เข้าสู่ระบบ',
    'register': 'สมัครสมาชิก',
    
    // Product
    'add_to_cart': 'เพิ่มลงตะกร้า',
    'out_of_stock': 'หมดสต็อก',
    'in_stock': 'มีสินค้า',
    'product_details': 'รายละเอียดสินค้า',
    'reviews': 'รีวิว',
    'rating': 'คะแนน',
    'description': 'คำอธิบาย',
    'specifications': 'ข้อมูลจำเพาะ',
    
    // Cart
    'cart_empty': 'ตะกร้าว่างเปล่า',
    'checkout': 'ชำระเงิน',
    'continue_shopping': 'ช้อปปิ้งต่อ',
    
    // Messages
    'product_added_to_cart': 'เพิ่มสินค้าลงตะกร้าแล้ว',
    'product_removed_from_cart': 'ลบสินค้าจากตะกร้าแล้ว',
    'product_added_to_wishlist': 'เพิ่มสินค้าลงรายการโปรดแล้ว',
    'product_removed_from_wishlist': 'ลบสินค้าจากรายการโปรดแล้ว',
  },
  id: {
    // Indonesian translations
    'loading': 'Memuat...',
    'error': 'Kesalahan',
    'success': 'Berhasil',
    'cancel': 'Batal',
    'save': 'Simpan',
    'delete': 'Hapus',
    'edit': 'Edit',
    'search': 'Cari',
    'filter': 'Filter',
    'sort': 'Urutkan',
    'price': 'Harga',
    'quantity': 'Kuantitas',
    'total': 'Total',
    'subtotal': 'Subtotal',
    'shipping': 'Pengiriman',
    'tax': 'Pajak',
    'discount': 'Diskon',
    
    // Navigation
    'home': 'Beranda',
    'products': 'Produk',
    'categories': 'Kategori',
    'cart': 'Keranjang',
    'wishlist': 'Daftar Keinginan',
    'orders': 'Pesanan',
    'profile': 'Profil',
    'settings': 'Pengaturan',
    'logout': 'Keluar',
    'login': 'Masuk',
    'register': 'Daftar',
    
    // Product
    'add_to_cart': 'Tambah ke Keranjang',
    'out_of_stock': 'Habis',
    'in_stock': 'Tersedia',
    'product_details': 'Detail Produk',
    'reviews': 'Ulasan',
    'rating': 'Peringkat',
    'description': 'Deskripsi',
    'specifications': 'Spesifikasi',
    
    // Cart
    'cart_empty': 'Keranjang Anda kosong',
    'checkout': 'Checkout',
    'continue_shopping': 'Lanjutkan Belanja',
    
    // Messages
    'product_added_to_cart': 'Produk ditambahkan ke keranjang',
    'product_removed_from_cart': 'Produk dihapus dari keranjang',
    'product_added_to_wishlist': 'Produk ditambahkan ke daftar keinginan',
    'product_removed_from_wishlist': 'Produk dihapus dari daftar keinginan',
  },
  ms: {
    // Malay translations
    'loading': 'Memuat...',
    'error': 'Ralat',
    'success': 'Berjaya',
    'cancel': 'Batal',
    'save': 'Simpan',
    'delete': 'Padam',
    'edit': 'Edit',
    'search': 'Cari',
    'filter': 'Tapis',
    'sort': 'Isih',
    'price': 'Harga',
    'quantity': 'Kuantiti',
    'total': 'Jumlah',
    'subtotal': 'Subjumlah',
    'shipping': 'Penghantaran',
    'tax': 'Cukai',
    'discount': 'Diskaun',
    
    // Navigation
    'home': 'Utama',
    'products': 'Produk',
    'categories': 'Kategori',
    'cart': 'Troli',
    'wishlist': 'Senarai Keinginan',
    'orders': 'Pesanan',
    'profile': 'Profil',
    'settings': 'Tetapan',
    'logout': 'Log keluar',
    'login': 'Log masuk',
    'register': 'Daftar',
    
    // Product
    'add_to_cart': 'Tambah ke Troli',
    'out_of_stock': 'Habis',
    'in_stock': 'Ada stok',
    'product_details': 'Butiran Produk',
    'reviews': 'Ulasan',
    'rating': 'Penarafan',
    'description': 'Penerangan',
    'specifications': 'Spesifikasi',
    
    // Cart
    'cart_empty': 'Troli anda kosong',
    'checkout': 'Daftar keluar',
    'continue_shopping': 'Terus membeli-belah',
    
    // Messages
    'product_added_to_cart': 'Produk ditambah ke troli',
    'product_removed_from_cart': 'Produk dipadam dari troli',
    'product_added_to_wishlist': 'Produk ditambah ke senarai keinginan',
    'product_removed_from_wishlist': 'Produk dipadam dari senarai keinginan',
  },
  tl: {
    // Filipino translations
    'loading': 'Naglo-load...',
    'error': 'Error',
    'success': 'Tagumpay',
    'cancel': 'Kanselahin',
    'save': 'I-save',
    'delete': 'Burahin',
    'edit': 'I-edit',
    'search': 'Hanapin',
    'filter': 'Salain',
    'sort': 'Ayusin',
    'price': 'Presyo',
    'quantity': 'Dami',
    'total': 'Kabuuan',
    'subtotal': 'Kabuuang bahagi',
    'shipping': 'Pagpapadala',
    'tax': 'Buwis',
    'discount': 'Diskwento',
    
    // Navigation
    'home': 'Home',
    'products': 'Mga Produkto',
    'categories': 'Mga Kategorya',
    'cart': 'Kariton',
    'wishlist': 'Listahan ng Nais',
    'orders': 'Mga Order',
    'profile': 'Profile',
    'settings': 'Mga Setting',
    'logout': 'Log-out',
    'login': 'Log-in',
    'register': 'Magrehistro',
    
    // Product
    'add_to_cart': 'Idagdag sa Kariton',
    'out_of_stock': 'Ubos na',
    'in_stock': 'Mayroon pa',
    'product_details': 'Mga Detalye ng Produkto',
    'reviews': 'Mga Review',
    'rating': 'Rating',
    'description': 'Deskripsyon',
    'specifications': 'Mga Espesipikasyon',
    
    // Cart
    'cart_empty': 'Ang kariton mo ay walang laman',
    'checkout': 'Checkout',
    'continue_shopping': 'Magpatuloy sa Pagbili',
    
    // Messages
    'product_added_to_cart': 'Idinagdag ang produkto sa kariton',
    'product_removed_from_cart': 'Tinanggal ang produkto sa kariton',
    'product_added_to_wishlist': 'Idinagdag ang produkto sa listahan ng nais',
    'product_removed_from_wishlist': 'Tinanggal ang produkto sa listahan ng nais',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Get saved language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage) {
      setLanguageState(savedLanguage);
    } else {
      // Detect browser language
      const browserLanguage = navigator.language.split('-')[0] as Language;
      if (translations[browserLanguage]) {
        setLanguageState(browserLanguage);
      }
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}