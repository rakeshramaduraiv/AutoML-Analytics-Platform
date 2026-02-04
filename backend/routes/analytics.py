from flask import Blueprint, request, jsonify
import pandas as pd
import os
from ml_engine.file_ingestion import FileIngestionEngine
from ml_engine.data_profiling import DataProfilingEngine
from ml_engine.document_processor import EnterpriseDocumentProcessor
import json
from datetime import datetime

analytics_bp = Blueprint('analytics', __name__)

# Initialize engines
ingestion_engine = FileIngestionEngine()
profiling_engine = DataProfilingEngine()
document_processor = EnterpriseDocumentProcessor()

@analytics_bp.route('/api/analytics/document', methods=['POST'])
def analyze_document():
    """Advanced document analytics including text mining and content analysis"""
    try:
        data = request.get_json()
        if not data or 'filename' not in data:
            return jsonify({'error': 'Filename is required'}), 400
        
        filename = data['filename']
        filepath = os.path.join('uploads', filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        # Process document
        result = document_processor.process_document(filepath)
        
        if not result.is_valid:
            return jsonify({'error': result.error_message}), 400
        
        # Advanced analytics
        analytics_result = {
            'success': True,
            'filename': filename,
            'document_type': result.metadata.document_type.value,
            
            # Content Analysis
            'content_analysis': {
                'total_words': result.metadata.word_count,
                'total_characters': result.metadata.character_count,
                'pages': result.metadata.page_count,
                'language': result.metadata.language,
                'readability_score': _calculate_readability(result.text_content) if result.text_content else None,
                'content_density': result.metadata.word_count / result.metadata.page_count if result.metadata.page_count else None
            },
            
            # Text Analytics
            'text_analytics': {
                'sentiment_analysis': {
                    'score': result.sentiment_score,
                    'classification': _classify_sentiment(result.sentiment_score) if result.sentiment_score else None
                },
                'key_phrases': result.key_phrases[:10] if result.key_phrases else [],
                'summary': result.summary,
                'word_frequency': _get_word_frequency(result.text_content) if result.text_content else {}
            },
            
            # Structure Analysis
            'structure_analysis': {
                'has_tables': result.metadata.has_tables,
                'table_count': result.metadata.table_count,
                'has_images': result.metadata.has_images,
                'extraction_quality': result.extraction_quality,
                'data_completeness': result.data_completeness
            },
            
            # Business Intelligence
            'business_insights': {
                'document_category': _categorize_document(result.text_content, result.metadata) if result.text_content else 'Unknown',
                'complexity_score': _calculate_complexity(result.text_content) if result.text_content else 0,
                'information_density': _calculate_info_density(result) if result.text_content else 0,
                'actionable_items': _extract_actionable_items(result.text_content) if result.text_content else []
            },
            
            # Processing Metadata
            'processing_info': {
                'extraction_method': result.metadata.extraction_method.value,
                'confidence_score': result.metadata.confidence_score,
                'processing_time': result.metadata.processing_time,
                'warnings': result.metadata.warnings or []
            }
        }
        
        # Add structured data analysis if available
        if result.structured_data is not None:
            data_profile = profiling_engine.profile_dataset(result.structured_data)
            analytics_result['structured_data_analysis'] = {
                'rows': len(result.structured_data),
                'columns': len(result.structured_data.columns),
                'data_quality_score': data_profile.overall_quality_score,
                'data_types': data_profile.data_type_distribution,
                'missing_data_percentage': sum(profile.missing_percentage for profile in data_profile.column_profiles.values()) / len(data_profile.column_profiles)
            }
        
        return jsonify(analytics_result)
    
    except Exception as e:
        return jsonify({'error': f'Document analytics failed: {str(e)}'}), 500

@analytics_bp.route('/api/analytics/batch', methods=['POST'])
def analyze_batch_documents():
    """Batch analysis of multiple documents"""
    try:
        data = request.get_json()
        if not data or 'filenames' not in data:
            return jsonify({'error': 'Filenames list is required'}), 400
        
        filenames = data['filenames']
        if not isinstance(filenames, list):
            return jsonify({'error': 'Filenames must be a list'}), 400
        
        batch_results = []
        summary_stats = {
            'total_documents': len(filenames),
            'successful_processing': 0,
            'failed_processing': 0,
            'total_words': 0,
            'total_pages': 0,
            'document_types': {},
            'languages': {},
            'average_sentiment': 0
        }
        
        sentiment_scores = []
        
        for filename in filenames:
            try:
                filepath = os.path.join('uploads', filename)
                if not os.path.exists(filepath):
                    batch_results.append({
                        'filename': filename,
                        'status': 'error',
                        'error': 'File not found'
                    })
                    summary_stats['failed_processing'] += 1
                    continue
                
                # Process document
                result = document_processor.process_document(filepath)
                
                if result.is_valid:
                    # Individual result
                    batch_results.append({
                        'filename': filename,
                        'status': 'success',
                        'document_type': result.metadata.document_type.value,
                        'word_count': result.metadata.word_count,
                        'page_count': result.metadata.page_count,
                        'language': result.metadata.language,
                        'sentiment_score': result.sentiment_score,
                        'has_tables': result.metadata.has_tables,
                        'extraction_quality': result.extraction_quality
                    })
                    
                    # Update summary stats
                    summary_stats['successful_processing'] += 1
                    summary_stats['total_words'] += result.metadata.word_count or 0
                    summary_stats['total_pages'] += result.metadata.page_count or 0
                    
                    # Document type distribution
                    doc_type = result.metadata.document_type.value
                    summary_stats['document_types'][doc_type] = summary_stats['document_types'].get(doc_type, 0) + 1
                    
                    # Language distribution
                    if result.metadata.language:
                        lang = result.metadata.language
                        summary_stats['languages'][lang] = summary_stats['languages'].get(lang, 0) + 1
                    
                    # Sentiment tracking
                    if result.sentiment_score is not None:
                        sentiment_scores.append(result.sentiment_score)
                
                else:
                    batch_results.append({
                        'filename': filename,
                        'status': 'error',
                        'error': result.error_message
                    })
                    summary_stats['failed_processing'] += 1
            
            except Exception as e:
                batch_results.append({
                    'filename': filename,
                    'status': 'error',
                    'error': str(e)
                })
                summary_stats['failed_processing'] += 1
        
        # Calculate average sentiment
        if sentiment_scores:
            summary_stats['average_sentiment'] = sum(sentiment_scores) / len(sentiment_scores)
        
        return jsonify({
            'success': True,
            'batch_results': batch_results,
            'summary_statistics': summary_stats,
            'processing_timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': f'Batch analytics failed: {str(e)}'}), 500

@analytics_bp.route('/api/analytics/compare', methods=['POST'])
def compare_documents():
    """Compare multiple documents for similarities and differences"""
    try:
        data = request.get_json()
        if not data or 'filenames' not in data or len(data['filenames']) < 2:
            return jsonify({'error': 'At least 2 filenames required for comparison'}), 400
        
        filenames = data['filenames'][:5]  # Limit to 5 documents for performance
        
        documents = []
        for filename in filenames:
            filepath = os.path.join('uploads', filename)
            if os.path.exists(filepath):
                result = document_processor.process_document(filepath)
                if result.is_valid:
                    documents.append({
                        'filename': filename,
                        'text': result.text_content,
                        'word_count': result.metadata.word_count,
                        'sentiment': result.sentiment_score,
                        'language': result.metadata.language,
                        'key_phrases': result.key_phrases
                    })
        
        if len(documents) < 2:
            return jsonify({'error': 'Not enough valid documents for comparison'}), 400
        
        # Comparison analysis
        comparison_result = {
            'success': True,
            'documents_compared': len(documents),
            'comparison_analysis': {
                'word_count_comparison': {doc['filename']: doc['word_count'] for doc in documents},
                'sentiment_comparison': {doc['filename']: doc['sentiment'] for doc in documents if doc['sentiment'] is not None},
                'language_distribution': {},
                'common_themes': _find_common_themes([doc['key_phrases'] for doc in documents if doc['key_phrases']]),
                'similarity_matrix': _calculate_similarity_matrix(documents)
            },
            'insights': {
                'most_similar_pair': None,
                'most_different_pair': None,
                'average_sentiment': None,
                'dominant_language': None
            }
        }
        
        # Language distribution
        for doc in documents:
            if doc['language']:
                lang = doc['language']
                comparison_result['comparison_analysis']['language_distribution'][lang] = \
                    comparison_result['comparison_analysis']['language_distribution'].get(lang, 0) + 1
        
        # Calculate insights
        sentiments = [doc['sentiment'] for doc in documents if doc['sentiment'] is not None]
        if sentiments:
            comparison_result['insights']['average_sentiment'] = sum(sentiments) / len(sentiments)
        
        # Dominant language
        lang_dist = comparison_result['comparison_analysis']['language_distribution']
        if lang_dist:
            comparison_result['insights']['dominant_language'] = max(lang_dist, key=lang_dist.get)
        
        return jsonify(comparison_result)
    
    except Exception as e:
        return jsonify({'error': f'Document comparison failed: {str(e)}'}), 500

# Helper functions
def _calculate_readability(text):
    """Simple readability score calculation"""
    if not text:
        return 0
    
    sentences = text.count('.') + text.count('!') + text.count('?')
    words = len(text.split())
    
    if sentences == 0 or words == 0:
        return 0
    
    # Simple Flesch-like score
    avg_sentence_length = words / sentences
    score = 206.835 - (1.015 * avg_sentence_length)
    return max(0, min(100, score))

def _classify_sentiment(score):
    """Classify sentiment score"""
    if score > 0.1:
        return 'Positive'
    elif score < -0.1:
        return 'Negative'
    else:
        return 'Neutral'

def _get_word_frequency(text, top_n=10):
    """Get top word frequencies"""
    if not text:
        return {}
    
    words = text.lower().split()
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
    filtered_words = [word for word in words if word not in stop_words and len(word) > 3]
    
    from collections import Counter
    word_freq = Counter(filtered_words)
    return dict(word_freq.most_common(top_n))

def _categorize_document(text, metadata):
    """Simple document categorization"""
    if not text:
        return 'Unknown'
    
    text_lower = text.lower()
    
    # Business categories
    if any(word in text_lower for word in ['contract', 'agreement', 'terms', 'conditions']):
        return 'Legal/Contract'
    elif any(word in text_lower for word in ['financial', 'budget', 'revenue', 'profit', 'cost']):
        return 'Financial'
    elif any(word in text_lower for word in ['report', 'analysis', 'summary', 'findings']):
        return 'Report/Analysis'
    elif any(word in text_lower for word in ['proposal', 'recommendation', 'strategy']):
        return 'Strategic'
    elif any(word in text_lower for word in ['manual', 'procedure', 'instruction', 'guide']):
        return 'Documentation'
    else:
        return 'General Business'

def _calculate_complexity(text):
    """Calculate text complexity score"""
    if not text:
        return 0
    
    words = text.split()
    long_words = [word for word in words if len(word) > 6]
    complexity = len(long_words) / len(words) if words else 0
    return round(complexity * 100, 2)

def _calculate_info_density(result):
    """Calculate information density"""
    if not result.text_content or not result.metadata.page_count:
        return 0
    
    # Simple metric: unique words per page
    unique_words = len(set(result.text_content.lower().split()))
    return round(unique_words / result.metadata.page_count, 2)

def _extract_actionable_items(text):
    """Extract potential actionable items"""
    if not text:
        return []
    
    actionable_patterns = ['must', 'should', 'need to', 'required', 'action', 'todo', 'deadline']
    sentences = text.split('.')
    
    actionable_items = []
    for sentence in sentences[:10]:  # Limit to first 10 sentences
        if any(pattern in sentence.lower() for pattern in actionable_patterns):
            actionable_items.append(sentence.strip())
    
    return actionable_items[:5]  # Return top 5

def _find_common_themes(key_phrases_list):
    """Find common themes across documents"""
    if not key_phrases_list:
        return []
    
    all_phrases = []
    for phrases in key_phrases_list:
        if phrases:
            all_phrases.extend(phrases)
    
    from collections import Counter
    phrase_freq = Counter(all_phrases)
    return [phrase for phrase, count in phrase_freq.most_common(10) if count > 1]

def _calculate_similarity_matrix(documents):
    """Simple similarity calculation between documents"""
    similarity_matrix = {}
    
    for i, doc1 in enumerate(documents):
        for j, doc2 in enumerate(documents):
            if i != j:
                key = f"{doc1['filename']} vs {doc2['filename']}"
                
                # Simple word overlap similarity
                if doc1['text'] and doc2['text']:
                    words1 = set(doc1['text'].lower().split())
                    words2 = set(doc2['text'].lower().split())
                    
                    intersection = len(words1.intersection(words2))
                    union = len(words1.union(words2))
                    
                    similarity = intersection / union if union > 0 else 0
                    similarity_matrix[key] = round(similarity, 3)
    
    return similarity_matrix