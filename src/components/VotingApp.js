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
  MenuItem,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Add as AddIcon,
  ThumbUp as ThumbUpIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  EmojiEvents as TrophyIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon
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
  const [currentTab, setCurrentTab] = useState(0);
  const [editingTopic, setEditingTopic] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTopicTitle, setEditTopicTitle] = useState('');
  const [editTopicAnswers, setEditTopicAnswers] = useState('');
  const [loading, setLoading] = useState(true);

  // 실시간 데이터 구독
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'topics'), (snapshot) => {
      const topicsData = [];
      snapshot.forEach((doc) => {
        topicsData.push({ id: doc.id, ...doc.data() });
      });
      setTopics(topicsData);
      setLoading(false);
    }, (error) => {
      console.error('Firebase 실시간 구독 오류:', error);
      setError('실시간 데이터 연결에 실패했습니다.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 새 주제 추가
  const handleAddTopic = async () => {
    if (!newTopic.trim()) return;

    try {
      setLoading(true);
      await addDoc(collection(db, 'topics'), {
        title: newTopic.trim(),
        answers: [],
        createdAt: new Date(),
        isPublished: false,
        isLocked: false
      });
      setNewTopic('');
    } catch (error) {
      setError('주제 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 주제 게시/비게시 토글
  const handleTogglePublish = async (topicId, currentStatus) => {
    try {
      const topicRef = doc(db, 'topics', topicId);
      await updateDoc(topicRef, { isPublished: !currentStatus });
    } catch (error) {
      setError('게시 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 주제 잠금/해제 토글
  const handleToggleLock = async (topicId, currentStatus) => {
    try {
      const topicRef = doc(db, 'topics', topicId);
      await updateDoc(topicRef, { isLocked: !currentStatus });
    } catch (error) {
      setError('잠금 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 주제 편집
  const handleEditTopic = (topic) => {
    setEditingTopic(topic);
    setEditTopicTitle(topic.title);
    setEditTopicAnswers(topic.answers.map(a => a.text).join('\n'));
    setShowEditDialog(true);
  };

  // 주제 저장
  const handleSaveTopic = async () => {
    if (!editTopicTitle.trim()) return;

    try {
      setLoading(true);
      const answersArray = editTopicAnswers
        .split('\n')
        .map(answer => answer.trim())
        .filter(answer => answer.length > 0)
        .map(answer => ({ text: answer, votes: 0 }));

      const topicRef = doc(db, 'topics', editingTopic.id);
      await updateDoc(topicRef, {
        title: editTopicTitle.trim(),
        answers: answersArray
      });

      setShowEditDialog(false);
      setEditingTopic(null);
      setEditTopicTitle('');
      setEditTopicAnswers('');
    } catch (error) {
      setError('주제 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 답변들을 한꺼번에 추가
  const handleAddAnswers = async () => {
    if (!newAnswers.trim() || !selectedTopic) return;

    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
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
      setLoading(true);
      await deleteDoc(doc(db, 'topics', topicId));
    } catch (error) {
      setError('주제 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 전체 초기화
  const handleReset = async () => {
    if (resetPassword !== 'admin123') {
      setError('비밀번호가 올바르지 않습니다.');
      return;
    }

    try {
      setLoading(true);
      const deletePromises = topics.map(topic => deleteDoc(doc(db, 'topics', topic.id)));
      await Promise.all(deletePromises);
      setShowResetDialog(false);
      setResetPassword('');
      setVotedAnswers(new Set());
    } catch (error) {
      setError('초기화 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getSortedAnswers = (answers) => {
    return [...answers].sort((a, b) => b.votes - a.votes);
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}`;
    }
  };

  const getFilteredTopics = () => {
    switch (currentTab) {
      case 0: // 모든 주제
        return topics;
      case 1: // 게시된 주제
        return topics.filter(topic => topic.isPublished);
      case 2: // 미게시 주제
        return topics.filter(topic => !topic.isPublished);
      default:
        return topics;
    }
  };

  const filteredTopics = getFilteredTopics();

  // 주제가 없을 때 표시할 안내 카드
  const EmptyStateCard = () => (
    <Card sx={{ textAlign: 'center', py: 4 }}>
      <CardContent>
        <InfoIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          아직 주제가 없습니다
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          첫 번째 주제를 추가해보세요!
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setNewTopic('오늘 점심 메뉴');
              document.querySelector('input[type="text"]')?.focus();
            }}
          >
            예시 주제 추가
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

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
            placeholder="예: 오늘 점심 메뉴, 팀 회식 장소, 주말 계획 등"
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={handleAddTopic}
            disabled={!newTopic.trim() || loading}
            startIcon={<AddIcon />}
          >
            추가
          </Button>
        </Box>
      </Paper>

      {/* 탭 메뉴 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label={`모든 주제 (${topics.length})`} />
          <Tab label={`게시된 주제 (${topics.filter(t => t.isPublished).length})`} />
          <Tab label={`미게시 주제 (${topics.filter(t => !t.isPublished).length})`} />
        </Tabs>
      </Paper>

      {/* 주제 목록 */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>데이터를 불러오는 중...</Typography>
        </Box>
      ) : filteredTopics.length === 0 ? (
        <EmptyStateCard />
      ) : (
        <Grid container spacing={3}>
          {filteredTopics.map((topic) => {
            const sortedAnswers = getSortedAnswers(topic.answers);
            
            return (
              <Grid item xs={12} key={topic.id}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">{topic.title}</Typography>
                      {topic.isPublished ? (
                        <Chip icon={<PublicIcon />} label="게시됨" color="success" size="small" />
                      ) : (
                        <Chip icon={<LockIcon />} label="미게시" color="warning" size="small" />
                      )}
                      {topic.isLocked && (
                        <Chip icon={<LockIcon />} label="잠금" color="error" size="small" />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedTopic(topic);
                          setShowAddAnswer(true);
                        }}
                        startIcon={<AddIcon />}
                        disabled={loading}
                      >
                        답변 추가
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleEditTopic(topic)}
                        disabled={loading}
                      >
                        <EditIcon />
                      </IconButton>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={topic.isPublished}
                            onChange={() => handleTogglePublish(topic.id, topic.isPublished)}
                            size="small"
                            disabled={loading}
                          />
                        }
                        label="게시"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={topic.isLocked}
                            onChange={() => handleToggleLock(topic.id, topic.isLocked)}
                            size="small"
                            disabled={loading}
                          />
                        }
                        label="잠금"
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteTopic(topic.id)}
                        disabled={loading}
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
                                  disabled={hasVoted || topic.isLocked || loading}
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
      )}

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
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddAnswer(false)} disabled={loading}>취소</Button>
          <Button onClick={handleAddAnswers} variant="contained" disabled={loading}>
            추가
          </Button>
        </DialogActions>
      </Dialog>

      {/* 주제 편집 다이얼로그 */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>주제 편집</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="주제 제목"
            value={editTopicTitle}
            onChange={(e) => setEditTopicTitle(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            disabled={loading}
          />
          <TextField
            fullWidth
            multiline
            rows={8}
            label="답변들을 입력하세요 (한 줄에 하나씩)"
            value={editTopicAnswers}
            onChange={(e) => setEditTopicAnswers(e.target.value)}
            placeholder="답변 1&#10;답변 2&#10;답변 3"
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)} disabled={loading}>취소</Button>
          <Button onClick={handleSaveTopic} variant="contained" startIcon={<SaveIcon />} disabled={loading}>
            저장
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
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)} disabled={loading}>취소</Button>
          <Button onClick={handleReset} color="error" variant="contained" disabled={loading}>
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
          disabled={loading}
        >
          초기화
        </Button>
      </Box>
    </Container>
  );
};

export default VotingApp; 