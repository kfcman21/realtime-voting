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
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  ThumbUp as ThumbUpIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';

const VotingApp = () => {
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showAddAnswer, setShowAddAnswer] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [error, setError] = useState('');

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

  // 새 답변 추가
  const handleAddAnswer = async () => {
    if (!newAnswer.trim() || !selectedTopic) return;

    try {
      const topicRef = doc(db, 'topics', selectedTopic.id);
      const updatedAnswers = [
        ...selectedTopic.answers,
        { text: newAnswer.trim(), votes: 0 }
      ];
      
      await updateDoc(topicRef, { answers: updatedAnswers });
      setNewAnswer('');
      setShowAddAnswer(false);
    } catch (error) {
      setError('답변 추가 중 오류가 발생했습니다.');
    }
  };

  // 투표하기
  const handleVote = async (topicId, answerIndex) => {
    try {
      const topicRef = doc(db, 'topics', topicId);
      const topic = topics.find(t => t.id === topicId);
      const updatedAnswers = [...topic.answers];
      updatedAnswers[answerIndex].votes += 1;
      
      await updateDoc(topicRef, { answers: updatedAnswers });
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
      } catch (error) {
        setError('초기화 중 오류가 발생했습니다.');
      }
    } else {
      setError('비밀번호가 올바르지 않습니다.');
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
        {topics.map((topic) => (
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
                  {topic.answers.map((answer, index) => (
                    <ListItem key={index} divider>
                      <ListItemText primary={answer.text} />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={answer.votes} color="primary" />
                          <IconButton
                            onClick={() => handleVote(topic.id, index)}
                            color="primary"
                          >
                            <ThumbUpIcon />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  아직 답변이 없습니다. 답변을 추가해보세요!
                </Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* 답변 추가 다이얼로그 */}
      <Dialog open={showAddAnswer} onClose={() => setShowAddAnswer(false)}>
        <DialogTitle>새 답변 추가</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="답변을 입력하세요"
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddAnswer(false)}>취소</Button>
          <Button onClick={handleAddAnswer} variant="contained">
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