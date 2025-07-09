import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Grid,
  TextareaAutosize,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  ThumbUp as ThumbUpIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';

const VotingApp = () => {
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [newAnswers, setNewAnswers] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showAddAnswer, setShowAddAnswer] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [error, setError] = useState('');
  const [votedAnswers, setVotedAnswers] = useState(new Set());

  // 실시간 데이터 구독
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'topics'), (snapshot) => {
      const topicsData = [];
      snapshot.forEach((doc) => {
        topicsData.push({ id: doc.id, ...doc.data() });
      });
      setTopics(topicsData);
    });

    return () => unsubscribe();
  }, []);

  // 새 주제 추가
  const handleAddTopic = async () => {
    if (!newTopic.trim()) return;

    try {
      await addDoc(collection(db, 'topics'), {
        title: newTopic.trim(),
        answers: [],
        createdAt: new Date()
      });
      setNewTopic('');
    } catch (error) {
      setError('주제 추가 중 오류가 발생했습니다.');
    }
  };

  // 답변들을 한꺼번에 추가
  const handleAddAnswers = async () => {
    if (!newAnswers.trim() || !selectedTopic) return;

    try {
      const answersArray = newAnswers
        .split('\n')
        .map(answer => answer.trim())
        .filter(answer => answer.length > 0)
        .map(answer => ({ text: answer, votes: 0 }));

      if (answersArray.length === 0) {
        setError('유효한 답변을 입력해주세요.');
        return;
      }

      const topicRef = doc(db, 'topics', selectedTopic.id);
      const updatedAnswers = [...selectedTopic.answers, ...answersArray];
      
      await updateDoc(topicRef, { answers: updatedAnswers });
      setNewAnswers('');
      setShowAddAnswer(false);
    } catch (error) {
      setError('답변 추가 중 오류가 발생했습니다.');
    }
  };

  // 투표하기 (중복 방지)
  const handleVote = async (topicId, answerIndex) => {
    const voteKey = `${topicId}-${answerIndex}`;
    
    if (votedAnswers.has(voteKey)) {
      setError('이미 투표한 답변입니다.');
      return;
    }

    try {
      const topicRef = doc(db, 'topics', topicId);
      const topic = topics.find(t => t.id === topicId);
      const updatedAnswers = [...topic.answers];
      updatedAnswers[answerIndex].votes += 1;
      
      await updateDoc(topicRef, { answers: updatedAnswers });
      
      // 투표 기록 추가
      setVotedAnswers(prev => new Set([...prev, voteKey]));
    } catch (error) {
      setError('투표 중 오류가 발생했습니다.');
    }
  };

  // 주제 삭제
  const handleDeleteTopic = async (topicId) => {
    try {
      await deleteDoc(doc(db, 'topics', topicId));
    } catch (error) {
      setError('주제 삭제 중 오류가 발생했습니다.');
    }
  };

  // 전체 초기화 (비밀번호: admin123)
  const handleReset = async () => {
    if (resetPassword === 'admin123') {
      try {
        for (const topic of topics) {
          await deleteDoc(doc(db, 'topics', topic.id));
        }
        setShowResetDialog(false);
        setResetPassword('');
        setVotedAnswers(new Set());
      } catch (error) {
        setError('초기화 중 오류가 발생했습니다.');
      }
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  };

  // 답변을 투표 수에 따라 정렬
  const getSortedAnswers = (answers) => {
    return [...answers].sort((a, b) => b.votes - a.votes);
  };

  // 순위 아이콘 가져오기
  const getRankIcon = (index) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}`;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          실시간 공감투표
        </Typography>
        <Typography variant="h6" color="text.secondary">
          주제를 입력하고 답변에 투표해보세요!
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 새 주제 추가 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          새 주제 추가
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="주제를 입력하세요"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
          />
          <Button
            variant="contained"
            onClick={handleAddTopic}
            disabled={!newTopic.trim()}
            startIcon={<AddIcon />}
          >
            추가
          </Button>
        </Box>
      </Paper>

      {/* 주제 목록 */}
      <Grid container spacing={3}>
        {topics.map((topic) => {
          const sortedAnswers = getSortedAnswers(topic.answers);
          
          return (
            <Grid item xs={12} key={topic.id}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{topic.title}</Typography>
                  <Box>
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedTopic(topic);
                        setShowAddAnswer(true);
                      }}
                      startIcon={<AddIcon />}
                    >
                      답변 추가
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteTopic(topic.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                {topic.answers.length > 0 ? (
                  <List>
                    {sortedAnswers.map((answer, index) => {
                      const originalIndex = topic.answers.findIndex(a => a.text === answer.text);
                      const voteKey = `${topic.id}-${originalIndex}`;
                      const hasVoted = votedAnswers.has(voteKey);
                      
                      return (
                        <ListItem key={originalIndex} divider>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                            <Typography variant="h6" color="primary">
                              {getRankIcon(index)}
                            </Typography>
                          </Box>
                          <ListItemText 
                            primary={answer.text}
                            secondary={`${answer.votes}표`}
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label={answer.votes} 
                                color={index < 3 ? "primary" : "default"}
                                icon={index < 3 ? <TrophyIcon /> : null}
                              />
                              <IconButton
                                onClick={() => handleVote(topic.id, originalIndex)}
                                color={hasVoted ? "disabled" : "primary"}
                                disabled={hasVoted}
                              >
                                <ThumbUpIcon />
                              </IconButton>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                  </List>
                ) : (
                  <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    아직 답변이 없습니다. 답변을 추가해보세요!
                  </Typography>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* 답변 일괄 추가 다이얼로그 */}
      <Dialog open={showAddAnswer} onClose={() => setShowAddAnswer(false)} maxWidth="md" fullWidth>
        <DialogTitle>답변 일괄 추가</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            여러 줄로 답변을 입력하세요. 각 줄이 하나의 답변이 됩니다.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="답변들을 입력하세요 (한 줄에 하나씩)"
            value={newAnswers}
            onChange={(e) => setNewAnswers(e.target.value)}
            placeholder="답변 1&#10;답변 2&#10;답변 3"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddAnswer(false)}>취소</Button>
          <Button onClick={handleAddAnswers} variant="contained">
            추가
          </Button>
        </DialogActions>
      </Dialog>

      {/* 초기화 다이얼로그 */}
      <Dialog open={showResetDialog} onClose={() => setShowResetDialog(false)}>
        <DialogTitle>전체 초기화</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            모든 주제와 답변이 삭제됩니다. 계속하시겠습니까?
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="비밀번호 입력 (admin123)"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)}>취소</Button>
          <Button onClick={handleReset} color="error" variant="contained">
            초기화
          </Button>
        </DialogActions>
      </Dialog>

      {/* 초기화 버튼 */}
      <Box sx={{ position: 'fixed', bottom: 20, right: 20 }}>
        <Button
          variant="contained"
          color="error"
          onClick={() => setShowResetDialog(true)}
          startIcon={<SettingsIcon />}
        >
          초기화
        </Button>
      </Box>
    </Container>
  );
};

export default VotingApp; 