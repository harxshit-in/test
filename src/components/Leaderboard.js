import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../styles/Leaderboard.css';

const Leaderboard = ({ examId, userAttempt, onClose }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [examTitle, setExamTitle] = useState('');

  useEffect(() => {
    if (examId) {
      fetchLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const fetchLeaderboard = async () => {
    try {
      console.log('Fetching leaderboard for exam:', examId);
      
      // Fetch all attempts for this exam
      const attemptsQuery = query(
        collection(db, 'attempts'),
        where('examId', '==', examId)
      );

      const snapshot = await getDocs(attemptsQuery);
      console.log('Attempts found:', snapshot.size);
      
      let attempts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort in memory: by score (desc), then by time (asc)
      attempts.sort((a, b) => {
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        const timeA = a.timeTaken || 999999;
        const timeB = b.timeTaken || 999999;
        return timeA - timeB;
      });

      // Limit to top 100
      attempts = attempts.slice(0, 100);

      // Fetch user details for each attempt
      const leaderboardData = [];
      for (let i = 0; i < attempts.length; i++) {
        const attempt = attempts[i];
        try {
          const userQuery = query(
            collection(db, 'users'),
            where('uid', '==', attempt.userId)
          );
          const userSnapshot = await getDocs(userQuery);
          const userData = userSnapshot.docs[0]?.data();
          
          const totalMarks = attempt.totalMarks || 100;
          const score = attempt.score || 0;
          const totalQuestions = attempt.totalQuestions || 100;
          const correctAnswers = attempt.correctAnswers || 0;
          
          leaderboardData.push({
            rank: i + 1,
            name: userData?.name || 'Anonymous User',
            score: score,
            totalMarks: totalMarks,
            percentage: ((score / totalMarks) * 100).toFixed(2),
            timeTaken: attempt.timeTaken || 0,
            accuracy: totalQuestions > 0 
              ? ((correctAnswers / totalQuestions) * 100).toFixed(1)
              : 0,
            attemptId: attempt.id,
            userId: attempt.userId
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          leaderboardData.push({
            rank: i + 1,
            name: 'Anonymous User',
            score: attempt.score || 0,
            totalMarks: attempt.totalMarks || 100,
            percentage: '0',
            timeTaken: attempt.timeTaken || 0,
            accuracy: '0',
            attemptId: attempt.id,
            userId: attempt.userId
          });
        }
      }

      console.log('Leaderboard data processed:', leaderboardData.length);
      setLeaderboard(leaderboardData);

      if (userAttempt) {
        setExamTitle(userAttempt.examTitle || 'Exam');
        const rank = leaderboardData.findIndex(item => item.attemptId === userAttempt.id);
        setUserRank(rank !== -1 ? rank + 1 : null);
        console.log('User rank:', rank + 1);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { emoji: '🥇', class: 'gold', text: 'Champion' };
    if (rank === 2) return { emoji: '🥈', class: 'silver', text: '2nd Place' };
    if (rank === 3) return { emoji: '🥉', class: 'bronze', text: '3rd Place' };
    if (rank <= 10) return { emoji: '🏆', class: 'top10', text: 'Top 10' };
    if (rank <= 25) return { emoji: '⭐', class: 'top25', text: 'Top 25' };
    return { emoji: '📊', class: 'participant', text: `Rank ${rank}` };
  };

  const getPerformanceBadge = (percentage) => {
    const perc = parseFloat(percentage);
    if (perc >= 90) return { text: 'Outstanding', class: 'outstanding' };
    if (perc >= 75) return { text: 'Excellent', class: 'excellent' };
    if (perc >= 60) return { text: 'Good', class: 'good' };
    if (perc >= 50) return { text: 'Average', class: 'average' };
    return { text: 'Needs Improvement', class: 'poor' };
  };

  if (loading) {
    return (
      <div className="leaderboard-modal" onClick={onClose}>
        <div className="leaderboard-content" onClick={(e) => e.stopPropagation()}>
          <div className="loading">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-modal" onClick={onClose}>
      <div className="leaderboard-content" onClick={(e) => e.stopPropagation()}>
        <div className="leaderboard-header">
          <h2>🏆 Leaderboard</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="leaderboard-exam-title">
          <p>{examTitle}</p>
          <span>{leaderboard.length} participant{leaderboard.length !== 1 ? 's' : ''}</span>
        </div>

        {userRank && (
          <div className="user-rank-card">
            <div className="rank-badge-large">
              <span className="rank-emoji">{getRankBadge(userRank).emoji}</span>
              <div className="rank-details">
                <h3>Your Rank</h3>
                <p className={`rank-number ${getRankBadge(userRank).class}`}>
                  #{userRank}
                </p>
                <span className="rank-label">{getRankBadge(userRank).text}</span>
              </div>
            </div>
            <div className="rank-stats">
              <div className="rank-stat">
                <span className="stat-value">
                  {userAttempt.score || 0}/{userAttempt.totalMarks || 100}
                </span>
                <span className="stat-label">Score</span>
              </div>
              <div className="rank-stat">
                <span className="stat-value">
                  {userAttempt.totalMarks > 0 
                    ? ((userAttempt.score / userAttempt.totalMarks) * 100).toFixed(1)
                    : 0}%
                </span>
                <span className="stat-label">Percentage</span>
              </div>
              <div className="rank-stat">
                <span className="stat-value">{formatTime(userAttempt.timeTaken)}</span>
                <span className="stat-label">Time</span>
              </div>
            </div>
          </div>
        )}

        <div className="leaderboard-table-container">
          {leaderboard.length === 0 ? (
            <div className="no-data-message">
              <p>No participants yet. Be the first!</p>
            </div>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Score</th>
                  <th>%</th>
                  <th>Accuracy</th>
                  <th>Time</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => {
                  const isCurrentUser = userAttempt && entry.attemptId === userAttempt.id;
                  const rankBadge = getRankBadge(entry.rank);
                  const perfBadge = getPerformanceBadge(entry.percentage);

                  return (
                    <tr 
                      key={entry.attemptId} 
                      className={`${isCurrentUser ? 'current-user' : ''} rank-${rankBadge.class}`}
                    >
                      <td className="rank-cell">
                        <span className="rank-badge">
                          <span className="rank-emoji-small">{rankBadge.emoji}</span>
                          <span>#{entry.rank}</span>
                        </span>
                      </td>
                      <td className="name-cell">
                        {entry.name}
                        {isCurrentUser && <span className="you-badge">You</span>}
                      </td>
                      <td className="score-cell">
                        <strong>{entry.score}</strong>/{entry.totalMarks}
                      </td>
                      <td className="percentage-cell">{entry.percentage}%</td>
                      <td className="accuracy-cell">{entry.accuracy}%</td>
                      <td className="time-cell">{formatTime(entry.timeTaken)}</td>
                      <td className="performance-cell">
                        <span className={`perf-badge ${perfBadge.class}`}>
                          {perfBadge.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="leaderboard-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
