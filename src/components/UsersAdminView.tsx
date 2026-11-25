import { FormEvent, useEffect, useState } from 'react';
import { UserPlus, Trash2, Pencil, RefreshCw, X, Loader2, Shield, User } from 'lucide-react';
import { SessionUser, UserAccount, UserRole } from '../types';

interface UsersAdminViewProps {
  currentUser: SessionUser;
  users: UserAccount[];
  isLoadingUsers: boolean;
  onRefreshUsers: () => Promise<void>;
  onSaveUser: (user: UserAccount) => Promise<void>;
  onDeleteUser: (user: UserAccount) => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function UsersAdminView({
  currentUser,
  users,
  isLoadingUsers,
  onRefreshUsers,
  onSaveUser,
  onDeleteUser,
  onNotify,
}: UsersAdminViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void onRefreshUsers();
  }, []);

  const openAdd = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setDisplayName('');
    setRole('staff');
    setIsModalOpen(true);
  };

  const openEdit = (user: UserAccount) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword(user.password || '');
    setDisplayName(user.displayName);
    setRole(user.role);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanDisplay = displayName.trim() || cleanUser;

    if (!cleanUser) {
      onNotify('error', 'กรุณากรอกชื่อผู้ใช้ (Username)');
      return;
    }
    if (!editingUser && !password.trim()) {
      onNotify('error', 'กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
      return;
    }

    setIsSaving(true);
    await onSaveUser({
      id: editingUser ? editingUser.id : cleanUser,
      username: cleanUser,
      password: password.trim() || editingUser?.password || '',
      displayName: cleanDisplay,
      role,
      active: true,
    });
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleDelete = async (target: UserAccount) => {
    if (target.username === currentUser.username) {
      onNotify('error', 'ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้');
      return;
    }
    await onDeleteUser(target);
  };

  return (
    <main className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6 pb-24 md:pb-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--theme-ink)]">จัดการผู้ใช้งาน (Users)</h1>
          <p className="text-sm text-[var(--theme-muted)] mt-0.5">
            กำหนดสิทธิ์แอดมิน (เข้าถึงทุกหน้า) และพนักงานขาย (ใช้งานเฉพาะหน้าขายหน้าร้าน)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void onRefreshUsers()}
            disabled={isLoadingUsers}
            className="h-11 px-4 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] hover:bg-[var(--theme-soft)] text-sm font-semibold text-[var(--theme-ink)] inline-flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>ดึงข้อมูลล่าสุด</span>
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="h-11 px-5 rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] font-bold text-sm inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            <span>เพิ่มผู้ใช้งาน</span>
          </button>
        </div>
      </div>

      <section className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--theme-border)]">
          <h2 className="text-base font-bold text-[var(--theme-ink)]">
            รายชื่อบัญชีทั้งหมด · {users.length} บัญชี
          </h2>
        </div>

        <div className="divide-y divide-[var(--theme-border)]/70">
          {users.map((u) => {
            const isSelf = u.username === currentUser.username;
            return (
              <div
                key={u.id || u.username}
                className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--theme-bg)]/40 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[var(--theme-soft)] text-[var(--theme-accent-ink)] flex items-center justify-center shrink-0">
                    {u.role === 'admin' ? (
                      <Shield className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <User className="w-5 h-5" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold text-[var(--theme-ink)] truncate">
                      {u.displayName} {isSelf ? '(คุณ)' : ''}
                    </p>
                    <p className="text-xs text-[var(--theme-muted)] mt-0.5">
                      @{u.username} · {u.role === 'admin' ? 'แอดมิน (Admin)' : 'พนักงานขาย (Staff)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={() => openEdit(u)}
                    aria-label={`แก้ไขผู้ใช้ ${u.username}`}
                    className="h-9 px-3 rounded-xl bg-[var(--theme-soft)] hover:bg-[var(--theme-soft-hover)] text-[var(--theme-accent-ink)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(u)}
                    disabled={isSelf}
                    aria-label={`ลบผู้ใช้ ${u.username}`}
                    className="h-9 w-9 rounded-xl text-[var(--theme-muted)] hover:text-[#C92A2A] hover:bg-[#FFF5F5] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingUser ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งาน'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[var(--theme-ink)]">
                {editingUser ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="ปิดหน้าต่างผู้ใช้งาน"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--theme-muted)] hover:bg-[var(--theme-soft)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="user-displayname"
                  className="block text-sm font-semibold text-[var(--theme-ink)] mb-1.5"
                >
                  ชื่อแสดงบนใบเสร็จ
                </label>
                <input
                  id="user-displayname"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="เช่น น้องมายด์ (บาริสต้า)"
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-sm text-[var(--theme-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40"
                />
              </div>

              <div>
                <label
                  htmlFor="user-username"
                  className="block text-sm font-semibold text-[var(--theme-ink)] mb-1.5"
                >
                  ชื่อผู้ใช้ (Username)
                </label>
                <input
                  id="user-username"
                  type="text"
                  required
                  disabled={Boolean(editingUser)}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น staff01"
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-sm text-[var(--theme-ink)] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40"
                />
              </div>

              <div>
                <label
                  htmlFor="user-password"
                  className="block text-sm font-semibold text-[var(--theme-ink)] mb-1.5"
                >
                  รหัสผ่าน {editingUser ? '(เว้นว่างได้หากไม่เปลี่ยน)' : ''}
                </label>
                <input
                  id="user-password"
                  type="text"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กำหนดรหัสผ่าน"
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-sm text-[var(--theme-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40"
                />
              </div>

              <div>
                <label
                  htmlFor="user-role"
                  className="block text-sm font-semibold text-[var(--theme-ink)] mb-1.5"
                >
                  บทบาทสิทธิ์การใช้งาน
                </label>
                <select
                  id="user-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full h-11 px-3 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-sm text-[var(--theme-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40"
                >
                  <option value="staff">พนักงานขาย (staff · หน้าร้านอย่างเดียว)</option>
                  <option value="admin">แอดมิน (admin · จัดการได้ทุกส่วน)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 px-4 rounded-xl border border-[var(--theme-border)] text-sm font-semibold text-[var(--theme-muted)] hover:text-[var(--theme-ink)] cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-11 px-5 rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] font-bold text-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  <span>บันทึกผู้ใช้งาน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
