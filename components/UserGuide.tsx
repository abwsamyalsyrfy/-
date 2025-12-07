import React from 'react';
import { BookOpen, LayoutDashboard, PlusCircle, Settings, UploadCloud, ListTodo } from 'lucide-react';

export const UserGuide: React.FC = () => {
  const Section = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
      <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Icon className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>
      <div className="text-slate-600 leading-relaxed space-y-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="bg-gradient-to-l from-blue-600 to-indigo-700 p-8 rounded-2xl text-white shadow-lg mb-8">
        <h1 className="text-3xl font-bold mb-2">الدليل الشامل لنظام GoalTrack</h1>
        <p className="text-blue-100 text-lg opacity-90">مرجعك الكامل لإدارة المهام والمتابعة وتقييم الأداء المؤسسي</p>
      </div>

      <Section title="مقدمة ولوحة المعلومات" icon={LayoutDashboard}>
        <p>
          توفر لوحة التحكم (Dashboard) نظرة شاملة وفورية على حالة العمل في المؤسسة. تم تصميمها لمساعدة المدراء وصناع القرار على:
        </p>
        <ul className="list-disc list-inside space-y-2 mr-4 bg-slate-50 p-4 rounded-lg">
          <li><strong>متابعة مؤشرات الأداء (KPIs):</strong> مثل نسبة الإنجاز العام وعدد المهام المتأخرة.</li>
          <li><strong>تحليل أداء الإدارات:</strong> من خلال الرسم البياني الذي يوضح حجم العمل الموكل لكل إدارة مقابل ما تم إنجازه.</li>
          <li><strong>الرسوم البيانية:</strong> توفر تحليلاً بصرياً لتوزيع حالات المهام (منجز، جاري، متأخر).</li>
          <li><strong>التصدير PDF:</strong> يمكنك النقر على زر "تصدير PDF" في أعلى اللوحة لحفظ تقرير شامل عن الأداء الحالي.</li>
        </ul>
      </Section>

      <Section title="إدارة الأهداف والمواضيع" icon={ListTodo}>
        <p>
          تعتبر صفحة "إدارة الأهداف" هي المحرك الرئيسي للنظام. من هنا يمكنك استعراض كافة المهام المسجلة.
        </p>
        <h3 className="font-bold text-slate-800 mt-4">الميزات الأساسية:</h3>
        <ul className="list-disc list-inside space-y-2 mr-4">
          <li><strong>التصفية والبحث:</strong> استخدم شريط البحث العلوي للبحث باسم الموضوع أو المرسل. استخدم القائمة المنسدلة لفلترة المهام حسب الحالة (متأخرة، منجزة، إلخ).</li>
          <li><strong>التصدير Excel:</strong> يمكنك تصدير القائمة المعروضة حالياً لملف Excel عبر زر "تصدير".</li>
          <li><strong>التفاصيل:</strong> بالنقر على أي صف في الجدول، ستنتقل لصفحة التفاصيل الخاصة بالمهمة.</li>
        </ul>
      </Section>

      <Section title="إضافة وتعديل المهام" icon={PlusCircle}>
        <p>
          لإضافة موضوع جديد، اضغط على "موضوع جديد" في القائمة الجانبية أو الزر الأزرق في صفحة القائمة.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <h4 className="font-bold text-yellow-800 mb-2">الحقول الهامة:</h4>
            <ul className="text-sm space-y-1 text-yellow-900">
              <li>• <strong>الإدارة المسؤولة:</strong> تحدد الجهة المنوط بها التنفيذ (يؤثر على الإحصائيات).</li>
              <li>• <strong>موعد الإنجاز:</strong> ضروري جداً لتحديد حالة التأخير.</li>
              <li>• <strong>الأولوية:</strong> تساعد في ترتيب المهام (عاجل يظهر بوضوح).</li>
            </ul>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="font-bold text-blue-800 mb-2">التعديل والحذف:</h4>
            <p className="text-sm text-blue-900">
              يمكنك تعديل بيانات المهمة أو حذفها بالكامل من خلال الدخول لصفحة تفاصيل المهمة واستخدام الأزرار العلوية (تعديل / حذف).
            </p>
          </div>
        </div>
      </Section>

      <Section title="نظام المتابعات والتقييم" icon={BookOpen}>
        <p>
          لا يكتفي النظام بتسجيل المهام، بل يتابع دورة حياتها. داخل صفحة تفاصيل كل مهمة، ستجد تبويب <strong>"سجل المتابعات"</strong>.
        </p>
        <h3 className="font-bold text-slate-800 mt-4">آلية التحديث التلقائي:</h3>
        <p className="mt-2 text-sm bg-gray-100 p-3 rounded">
          النظام ذكي! عند إضافة متابعة جديدة، إذا اخترت مستوى تقدم "ممتاز" أو كتبت في النتيجة كلمة "تم" أو "منجز"، سيقوم النظام تلقائياً بتحويل حالة المهمة الرئيسية إلى <strong>"منجز"</strong>. والعكس صحيح، إذا كان التقييم "سيئ"، ستتحول الحالة لـ "محتاج متابعة".
        </p>
      </Section>

      <Section title="استيراد البيانات والإعدادات" icon={UploadCloud}>
        <p>
          <strong>الاستيراد:</strong> يتيح لك النظام رفع ملفات Excel لإدخال كميات كبيرة من البيانات دفعة واحدة. تأكد من مطابقة أسماء الأعمدة (TopicID, Title, Priority...).
        </p>
        <div className="mt-4 border-t pt-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            الإعدادات والصلاحيات:
          </h3>
          <p className="mt-2">
            يمكن لمدير النظام فقط:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-slate-600">
            <li>إضافة مستخدمين جدد للنظام.</li>
            <li>تعديل صلاحيات المستخدمين (مدير، مستخدم عادي).</li>
            <li>إجراء "إعادة ضبط المصنع" لحذف كافة البيانات والبدء من جديد.</li>
          </ul>
        </div>
      </Section>
      
      <div className="text-center text-slate-400 text-sm py-6">
        الإصدار 2.0 - جميع الحقوق محفوظة
      </div>
    </div>
  );
};