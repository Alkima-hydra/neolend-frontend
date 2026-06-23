import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getApplicantByUserId, getCourses, getCourseProgress, completeLesson } from "../../api/api";
import styles from "../shared.module.css";

export default function EducationPage() {
  const { user } = useAuth();
  const [applicant, setApplicant] = useState(null);
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getApplicantByUserId(user.id)
      .then((a) => {
        setApplicant(a);
        return Promise.all([getCourses(), getCourseProgress(a.id)]);
      })
      .then(([c, p]) => { setCourses(c); setProgress(p); })
      .finally(() => setLoading(false));
  }, [user.id]);

  function getProgress(courseId) {
    return progress.find((p) => p.courseId === courseId);
  }

  async function handleProgress(courseId, current) {
    const next = Math.min((current || 0) + 25, 100);
    const result = await completeLesson(applicant.id, courseId, next);
    setProgress((prev) => {
      const idx = prev.findIndex((p) => p.courseId === courseId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], progressPercent: next, completed: next >= 100 };
        return updated;
      }
      return [...prev, { courseId, progressPercent: next, completed: next >= 100 }];
    });
    if (next >= 100) setSuccess(`¡Curso completado! Obtuviste puntos y bonificación de tasa.`);
  }

  const totalPoints = progress.filter((p) => p.completed).length * 100;

  if (loading) return <div className={styles.loading}>Cargando cursos...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Educación Financiera</h1>
      <p className={styles.pageSubtitle}>Aprende y mejora tu score crediticio con cursos gamificados</p>

      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalPoints}</div>
          <div className={styles.statLabel}>Puntos acumulados</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{progress.filter((p) => p.completed).length}</div>
          <div className={styles.statLabel}>Cursos completados</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{courses.length}</div>
          <div className={styles.statLabel}>Cursos disponibles</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {courses.map((course) => {
          const prog = getProgress(course.id);
          const pct = prog?.progressPercent || 0;
          const done = prog?.completed || false;
          return (
            <div className={styles.card} key={course.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{course.title}</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{course.description}</div>
                </div>
                {done && <span className={`${styles.badge} ${styles.badgeGreen}`}>Completado ✓</span>}
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                <span className={`${styles.badge} ${styles.badgeBlue}`}>+{course.pointsReward} pts</span>
                <span className={`${styles.badge} ${styles.badgeGreen}`}>Score +{course.scoreBonus}</span>
                <span className={`${styles.badge} ${styles.badgeYellow}`}>-{course.interestDiscount}% tasa</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div className={styles.progressBar} style={{ flex: 1 }}>
                  <div className={styles.progressFill} style={{ width: `${pct}%`, background: done ? "#4ade80" : "#38bdf8" }} />
                </div>
                <span style={{ fontSize: "0.8rem", color: "#64748b", minWidth: 35 }}>{pct}%</span>
              </div>

              {!done && (
                <div className={styles.btnRow}>
                  <button
                    className={styles.btnPrimary}
                    style={{ fontSize: "0.85rem", padding: "6px 14px" }}
                    onClick={() => handleProgress(course.id, pct)}
                  >
                    {pct === 0 ? "Iniciar curso" : "Continuar (+25%)"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
