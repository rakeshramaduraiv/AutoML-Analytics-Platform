"""
Enterprise Explainability & Insights Engine
Generates business-ready model explanations and insights
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

from ml_engine.automl_engine import AutoMLResult, ModelType
from ml_engine.dataset_intelligence import ProblemType

class InsightType(Enum):
    PERFORMANCE = "performance"
    FEATURE_IMPORTANCE = "feature_importance"
    PREDICTION_CONFIDENCE = "prediction_confidence"
    DATA_QUALITY_IMPACT = "data_quality_impact"
    BUSINESS_IMPACT = "business_impact"
    RISK_ASSESSMENT = "risk_assessment"

@dataclass
class ModelInsight:
    """Individual model insight"""
    insight_type: InsightType
    title: str
    description: str
    business_impact: str
    confidence_level: str
    supporting_data: Dict[str, Any]
    recommendations: List[str]

@dataclass
class ExplainabilityReport:
    """Complete explainability report"""
    model_name: str
    problem_type: ProblemType
    
    # Performance insights
    performance_insights: List[ModelInsight]
    
    # Feature insights
    feature_insights: List[ModelInsight]
    
    # Business insights
    business_insights: List[ModelInsight]
    
    # Risk assessment
    risk_insights: List[ModelInsight]
    
    # Executive summary
    executive_summary: Dict[str, Any]
    
    # Visualizations metadata
    visualizations_generated: List[str]
    
    # Overall recommendations
    overall_recommendations: List[str]

class ExplainabilityEngine:
    """
    Enterprise explainability engine
    Generates business-ready insights and explanations
    """
    
    def __init__(self, output_dir: str = "insights"):
        self.output_dir = output_dir
        import os
        os.makedirs(output_dir, exist_ok=True)
        
        # Business impact templates
        self.impact_templates = {
            'high_accuracy': "Model achieves {accuracy:.1%} accuracy, enabling reliable automated decision-making",
            'feature_importance': "Feature '{feature}' drives {importance:.1%} of predictions, indicating key business lever",
            'low_confidence': "Model confidence varies significantly, requiring human oversight for {percentage:.1%} of predictions",
            'data_quality': "Data quality issues may impact {percentage:.1%} of predictions",
            'bias_risk': "Potential bias detected in feature '{feature}' - requires fairness assessment"
        }
    
    def generate_explainability_report(self, automl_result: AutoMLResult, dataset_profile: Any) -> ExplainabilityReport:
        """
        Generate comprehensive explainability report
        """
        
        # Generate different types of insights
        performance_insights = self._generate_performance_insights(automl_result)
        feature_insights = self._generate_feature_insights(automl_result)
        business_insights = self._generate_business_insights(automl_result, dataset_profile)
        risk_insights = self._generate_risk_insights(automl_result, dataset_profile)
        
        # Generate executive summary
        executive_summary = self._generate_executive_summary(automl_result, performance_insights, risk_insights)
        
        # Generate visualizations
        visualizations = self._generate_visualizations(automl_result)
        
        # Overall recommendations
        overall_recommendations = self._generate_overall_recommendations(
            performance_insights, feature_insights, business_insights, risk_insights
        )
        
        return ExplainabilityReport(
            model_name=automl_result.best_model.model_type.value,
            problem_type=automl_result.problem_type,
            performance_insights=performance_insights,
            feature_insights=feature_insights,
            business_insights=business_insights,
            risk_insights=risk_insights,
            executive_summary=executive_summary,
            visualizations_generated=visualizations,
            overall_recommendations=overall_recommendations
        )
    
    def _generate_performance_insights(self, automl_result: AutoMLResult) -> List[ModelInsight]:
        """Generate performance-related insights"""
        insights = []
        best_model = automl_result.best_model
        
        # Overall performance insight
        performance_level = "Excellent" if best_model.test_score > 0.9 else \
                           "Good" if best_model.test_score > 0.8 else \
                           "Fair" if best_model.test_score > 0.7 else "Poor"
        
        insights.append(ModelInsight(
            insight_type=InsightType.PERFORMANCE,
            title=f"{performance_level} Model Performance",
            description=f"Model achieves {best_model.test_score:.1%} accuracy on test data with {best_model.std_cv_score:.3f} standard deviation across cross-validation folds.",
            business_impact=self.impact_templates['high_accuracy'].format(accuracy=best_model.test_score),
            confidence_level="High" if best_model.std_cv_score < 0.05 else "Medium",
            supporting_data={
                'test_accuracy': best_model.test_score,
                'cv_mean': best_model.mean_cv_score,
                'cv_std': best_model.std_cv_score,
                'training_time': best_model.training_time
            },
            recommendations=self._get_performance_recommendations(best_model)
        ))
        
        # Model comparison insight
        model_comparison = automl_result.model_comparison
        best_vs_worst = model_comparison.iloc[0]['CV_Score_Mean'] - model_comparison.iloc[-1]['CV_Score_Mean']
        
        insights.append(ModelInsight(
            insight_type=InsightType.PERFORMANCE,
            title="Model Selection Confidence",
            description=f"{best_model.model_type.value} outperforms other algorithms by {best_vs_worst:.3f} points on average.",
            business_impact=f"Algorithm selection provides {best_vs_worst:.1%} improvement over baseline approaches",
            confidence_level="High" if best_vs_worst > 0.05 else "Medium",
            supporting_data={
                'performance_gap': best_vs_worst,
                'models_tested': len(automl_result.all_models),
                'best_model': best_model.model_type.value
            },
            recommendations=["Deploy selected model with confidence", "Monitor performance over time"]
        ))
        
        return insights
    
    def _generate_feature_insights(self, automl_result: AutoMLResult) -> List[ModelInsight]:
        """Generate feature importance insights"""
        insights = []
        best_model = automl_result.best_model
        
        if not best_model.feature_importance:
            return insights
        
        # Sort features by importance
        sorted_features = sorted(best_model.feature_importance.items(), key=lambda x: x[1], reverse=True)
        
        # Top feature insight
        top_feature, top_importance = sorted_features[0]
        insights.append(ModelInsight(
            insight_type=InsightType.FEATURE_IMPORTANCE,
            title=f"Primary Driver: {top_feature}",
            description=f"Feature '{top_feature}' contributes {top_importance:.1%} to model predictions, making it the most influential factor.",
            business_impact=self.impact_templates['feature_importance'].format(feature=top_feature, importance=top_importance),
            confidence_level="High",
            supporting_data={
                'feature_name': top_feature,
                'importance_score': top_importance,
                'rank': 1
            },
            recommendations=[
                f"Focus business efforts on optimizing {top_feature}",
                f"Ensure data quality for {top_feature} is maintained",
                f"Monitor {top_feature} for any distribution changes"
            ]
        ))
        
        # Feature concentration insight
        top_3_importance = sum([imp for _, imp in sorted_features[:3]])
        if top_3_importance > 0.7:
            insights.append(ModelInsight(
                insight_type=InsightType.FEATURE_IMPORTANCE,
                title="Feature Concentration Risk",
                description=f"Top 3 features account for {top_3_importance:.1%} of model decisions, indicating high concentration.",
                business_impact="Model heavily relies on few key factors - changes to these could significantly impact performance",
                confidence_level="Medium",
                supporting_data={
                    'top_3_concentration': top_3_importance,
                    'total_features': len(sorted_features)
                },
                recommendations=[
                    "Consider feature diversification strategies",
                    "Implement monitoring for top features",
                    "Develop contingency plans for key feature changes"
                ]
            ))
        
        return insights
    
    def _generate_business_insights(self, automl_result: AutoMLResult, dataset_profile: Any) -> List[ModelInsight]:
        """Generate business-focused insights"""
        insights = []
        
        # ROI potential insight
        accuracy = automl_result.best_model.test_score
        if automl_result.problem_type in [ProblemType.BINARY_CLASSIFICATION, ProblemType.MULTICLASS_CLASSIFICATION]:
            potential_automation = accuracy * 100
            insights.append(ModelInsight(
                insight_type=InsightType.BUSINESS_IMPACT,
                title="Automation Potential",
                description=f"Model can automate approximately {potential_automation:.0f}% of decisions with current accuracy level.",
                business_impact=f"Potential to reduce manual decision-making workload by {potential_automation:.0f}%",
                confidence_level=automl_result.confidence_level,
                supporting_data={
                    'automation_percentage': potential_automation,
                    'accuracy': accuracy
                },
                recommendations=[
                    "Implement gradual automation rollout",
                    "Establish human oversight for edge cases",
                    "Track automation success metrics"
                ]
            ))
        
        # Data readiness insight
        quality_score = dataset_profile.overall_quality_score
        insights.append(ModelInsight(
            insight_type=InsightType.DATA_QUALITY_IMPACT,
            title="Data Foundation Assessment",
            description=f"Dataset quality score of {quality_score:.0f}/100 indicates {'strong' if quality_score > 80 else 'moderate' if quality_score > 60 else 'weak'} data foundation.",
            business_impact=f"Data quality {'supports' if quality_score > 70 else 'may limit'} reliable model performance in production",
            confidence_level="High",
            supporting_data={
                'quality_score': quality_score,
                'total_rows': dataset_profile.total_rows,
                'total_columns': dataset_profile.total_columns
            },
            recommendations=self._get_data_quality_recommendations(quality_score)
        ))
        
        return insights
    
    def _generate_risk_insights(self, automl_result: AutoMLResult, dataset_profile: Any) -> List[ModelInsight]:
        """Generate risk assessment insights"""
        insights = []
        
        # Performance variance risk
        cv_std = automl_result.best_model.std_cv_score
        if cv_std > 0.1:
            insights.append(ModelInsight(
                insight_type=InsightType.RISK_ASSESSMENT,
                title="Performance Stability Risk",
                description=f"Cross-validation standard deviation of {cv_std:.3f} indicates potential performance instability.",
                business_impact="Model performance may vary significantly across different data samples",
                confidence_level="High",
                supporting_data={
                    'cv_std': cv_std,
                    'cv_scores': automl_result.best_model.cv_scores
                },
                recommendations=[
                    "Collect more training data to improve stability",
                    "Implement performance monitoring in production",
                    "Consider ensemble methods for better stability"
                ]
            ))
        
        # Overfitting risk
        train_test_gap = abs(automl_result.best_model.mean_cv_score - automl_result.best_model.test_score)
        if train_test_gap > 0.1:
            insights.append(ModelInsight(
                insight_type=InsightType.RISK_ASSESSMENT,
                title="Overfitting Risk",
                description=f"Gap of {train_test_gap:.3f} between cross-validation and test performance suggests potential overfitting.",
                business_impact="Model may not generalize well to new, unseen data",
                confidence_level="Medium",
                supporting_data={
                    'performance_gap': train_test_gap,
                    'cv_score': automl_result.best_model.mean_cv_score,
                    'test_score': automl_result.best_model.test_score
                },
                recommendations=[
                    "Apply regularization techniques",
                    "Increase training data size",
                    "Simplify model complexity"
                ]
            ))
        
        return insights
    
    def _generate_executive_summary(self, automl_result: AutoMLResult, performance_insights: List[ModelInsight], risk_insights: List[ModelInsight]) -> Dict[str, Any]:
        """Generate executive summary"""
        
        # Determine readiness level
        accuracy = automl_result.best_model.test_score
        risk_count = len(risk_insights)
        
        if accuracy > 0.85 and risk_count == 0:
            readiness = "Production Ready"
        elif accuracy > 0.75 and risk_count <= 1:
            readiness = "Near Production Ready"
        else:
            readiness = "Requires Improvement"
        
        return {
            'model_name': automl_result.best_model.model_type.value,
            'accuracy': f"{accuracy:.1%}",
            'confidence_level': automl_result.confidence_level,
            'readiness_status': readiness,
            'key_strengths': self._extract_key_strengths(performance_insights),
            'key_risks': self._extract_key_risks(risk_insights),
            'business_recommendation': self._get_business_recommendation(readiness, accuracy)
        }
    
    def _generate_visualizations(self, automl_result: AutoMLResult) -> List[str]:
        """Generate visualization files"""
        visualizations = []
        
        try:
            # Model comparison chart
            plt.figure(figsize=(10, 6))
            comparison_df = automl_result.model_comparison
            plt.bar(comparison_df['Model'], comparison_df['CV_Score_Mean'])
            plt.title('Model Performance Comparison')
            plt.xlabel('Model')
            plt.ylabel('Cross-Validation Score')
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            viz_path = f"{self.output_dir}/model_comparison.png"
            plt.savefig(viz_path)
            plt.close()
            visualizations.append(viz_path)
            
            # Feature importance chart (if available)
            if automl_result.best_model.feature_importance:
                plt.figure(figsize=(10, 6))
                features = list(automl_result.best_model.feature_importance.keys())
                importances = list(automl_result.best_model.feature_importance.values())
                
                plt.barh(features, importances)
                plt.title('Feature Importance')
                plt.xlabel('Importance Score')
                plt.tight_layout()
                
                viz_path = f"{self.output_dir}/feature_importance.png"
                plt.savefig(viz_path)
                plt.close()
                visualizations.append(viz_path)
                
        except Exception as e:
            print(f"Visualization generation failed: {str(e)}")
        
        return visualizations
    
    def _get_performance_recommendations(self, best_model) -> List[str]:
        """Get performance-specific recommendations"""
        recommendations = []
        
        if best_model.test_score > 0.9:
            recommendations.append("Excellent performance - ready for production deployment")
        elif best_model.test_score > 0.8:
            recommendations.append("Good performance - consider A/B testing before full deployment")
        else:
            recommendations.append("Performance needs improvement - collect more data or engineer features")
        
        if best_model.std_cv_score > 0.05:
            recommendations.append("High variance detected - consider regularization or more data")
        
        return recommendations
    
    def _get_data_quality_recommendations(self, quality_score: float) -> List[str]:
        """Get data quality recommendations"""
        if quality_score > 80:
            return ["Data quality is excellent - maintain current data processes"]
        elif quality_score > 60:
            return ["Address moderate data quality issues before production", "Implement data validation pipelines"]
        else:
            return ["Significant data quality improvements needed", "Focus on data cleaning and validation", "Consider data source improvements"]
    
    def _extract_key_strengths(self, performance_insights: List[ModelInsight]) -> List[str]:
        """Extract key strengths from insights"""
        strengths = []
        for insight in performance_insights:
            if insight.confidence_level == "High":
                strengths.append(insight.title)
        return strengths[:3]  # Top 3 strengths
    
    def _extract_key_risks(self, risk_insights: List[ModelInsight]) -> List[str]:
        """Extract key risks from insights"""
        return [insight.title for insight in risk_insights]
    
    def _get_business_recommendation(self, readiness: str, accuracy: float) -> str:
        """Get overall business recommendation"""
        if readiness == "Production Ready":
            return f"Deploy model with {accuracy:.1%} accuracy - implement monitoring and feedback loops"
        elif readiness == "Near Production Ready":
            return f"Address identified risks before deployment - model shows {accuracy:.1%} accuracy potential"
        else:
            return "Improve model performance and data quality before considering production deployment"
    
    def _generate_overall_recommendations(self, performance_insights, feature_insights, business_insights, risk_insights) -> List[str]:
        """Generate overall recommendations"""
        recommendations = []
        
        # Collect all recommendations
        all_insights = performance_insights + feature_insights + business_insights + risk_insights
        all_recommendations = []
        for insight in all_insights:
            all_recommendations.extend(insight.recommendations)
        
        # Deduplicate and prioritize
        unique_recommendations = list(set(all_recommendations))
        
        # Prioritize based on keywords
        priority_keywords = ['production', 'deploy', 'monitor', 'data quality', 'performance']
        prioritized = []
        
        for keyword in priority_keywords:
            for rec in unique_recommendations:
                if keyword.lower() in rec.lower() and rec not in prioritized:
                    prioritized.append(rec)
        
        # Add remaining recommendations
        for rec in unique_recommendations:
            if rec not in prioritized:
                prioritized.append(rec)
        
        return prioritized[:10]  # Top 10 recommendations

# Usage example
if __name__ == "__main__":
    # This would typically be called with real AutoML results
    print("Explainability Engine ready for integration")
    print("Use generate_explainability_report() with AutoML results")