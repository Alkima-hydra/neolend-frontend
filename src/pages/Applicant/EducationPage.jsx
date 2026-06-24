import { useState, useEffect } from "react";
import { BookOpen, Award, ChevronRight, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getApplicantByUserId, getCourses, getCourseProgress, completeLesson } from "../../api/AuditApi";
import styles from "../shared.module.css";

export default function EducationPage() {
  const { user } = useAuth();
  const [applicant, setApplicant] = useState(null);
  const [courses, setCourses]     = useState([]);
  const [progress, setProgress]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [success, setSuccess]     = useState("");

  useEffect(() => {
    getApplicantByUserId(user.id)
      .then((a) => { setApplicant(a); return Promise.all([getCourses(), getCourseProgress(a.id)]); })
      .then(([c, p]) => { setCourses(c); setProgress(p); })
      .finally(() => setLoading(false));
  }, [user.id]);

  function getProg(courseId) { return progress.find((p) => p.courseId === courseId); }

  async function handleNext(courseId, current) {
    const next = Math.min((current || 0) + 25, 100);
    await completeLesson(applicant.id, courseId, next);
    setProgress((prev) => {
      const idx = prev.findIndex((p) => p.courseId === courseId);
      const updated = { courseId, progressPercent: next, completed: next >= 100 };
      if (idx >= 0) { const arr = [...prev]; arr[idx] = updated; return arr; }
      return [...prev, updated];
    });
    if (next >= 100) setSuccess("Curso completado. Has ganado puntos y una bonificación en tu tasa de interés.");
  }

  const completed = progress.filter((p) => p.completed).length;
  const points    = completed * 120;

  if (loading) return <div className={styles.loading}>Cargando cursos...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Educación Financiera</h1>
        <p className={styles.pageSubtitle}>Aprende y mejora tu score crediticio completando cursos</p>
      </div>

      {success && <div className={styles.success} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Award size={15} />{success}
      </div>}

      <div className={styles.statGrid}>
        {[
          { label: "Puntos acumulados",    value: points,             color: "#d97706" },
          { label: "Cursos completados",   value: completed,          color: "#16a34a" },
          { label: "Cursos disponibles",   value: courses.length,     color: "#1d4ed8" },
          { label: "Bonificación de tasa", value: `${completed * 0.75}%`, color: "#7c3aed" },
        ].map((s) => (
          <div className={styles.statCard} key={s.label}>
            <div className={styles.statValue} style={{ color: s.color, fontSize: "1.5rem" }}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {courses.map((course) => {
        const prog = getProg(course.id);
        const pct  = prog?.progressPercent || 0;
        const done = prog?.completed || false;
        return (
          <div className={styles.card} key={course.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: "0.875rem", flex: 1 }}>
                <div style={{ width: 40, height: 40, background: done ? "#f0fdf4" : "#eff6ff", border: `1px solid ${done ? "#bbf7d0" : "#bfdbfe"}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {done ? <CheckCircle size={18} color="#16a34a" /> : <BookOpen size={18} color="#1d4ed8" />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 3 }}>{course.title}</div>
                  <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>{course.description}</div>
                </div>
              </div>
              {done && <span className={`${styles.badge} ${styles.badgeGreen}`}>Completado</span>}
            </div>

            <div style={{ display: "flex", gap: "0.625rem", margin: "0.875rem 0", flexWrap: "wrap" }}>
              <span className={`${styles.badge} ${styles.badgeBlue}`}>+{course.pointsReward} puntos</span>
              <span className={`${styles.badge} ${styles.badgeGreen}`}>Score +{course.scoreBonus}</span>
              <span className={`${styles.badge} ${styles.badgeYellow}`}>-{course.interestDiscount}% en tasa</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: done ? 0 : "0.875rem" }}>
              <div className={styles.progressBar} style={{ flex: 1 }}>
                <div className={styles.progressFill} style={{ width: `${pct}%`, background: done ? "#16a34a" : "#3b82f6" }} />
              </div>
              <span style={{ fontSize: "0.75rem", color: "#64748b", minWidth: 34 }}>{pct}%</span>
            </div>

            {!done && (
              <button
                className={styles.btnPrimary}
                style={{ fontSize: "0.8125rem" }}
                onClick={() => handleNext(course.id, pct)}
              >
                {pct === 0 ? "Iniciar curso" : "Continuar"} <ChevronRight size={13} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
