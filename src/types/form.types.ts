export interface IFormProps<T> {
    loading: boolean;
    onSubmit: (values: T) => void;
}